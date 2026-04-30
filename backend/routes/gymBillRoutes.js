import express from "express";
import multer from "multer";
import fs from "fs";
import GymBill from "../models/GymBill.js";
import Followup from "../models/Followup.js";
import { generateInvoicePDF } from "../utils/generateInvoice.js";
import { sendInvoiceMail } from "../utils/mailer.js";
const router = express.Router();
import {
  sendNewClientMail,
  sendRenewalMail
} from "../utils/mailer.js";
// ----------------------
// 🗂️ Multer Configuration
// ----------------------
const upload = multer({ dest: "uploads/" });

// ----------------------
// 🖼️ Serve Image by ID
// ----------------------
router.get("/image/:id", async (req, res) => {
  try {
    const bill = await GymBill.findById(req.params.id);

    if (!bill || !bill.profilePicture?.data) {
      return res.status(404).json({ message: "Image not found" });
    }

    const imgBuffer = Buffer.from(bill.profilePicture.data);
    res.writeHead(200, {
      "Content-Type": bill.profilePicture.contentType,
      "Content-Length": imgBuffer.length,
      "Cache-Control": "public, max-age=31536000",
    });
    res.end(imgBuffer);
  } catch (error) {
    console.error("❌ Image fetch error:", error);
    res.status(500).json({ message: "Error fetching image", error: error.message });
  }
});

router.get("/invoice/pdf/:id", async (req, res) => {
  try {
    const bill = await GymBill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    const profilePic = bill.profilePicture?.data
      ? Buffer.from(bill.profilePicture.data)
      : null;

    const pdfBuffer = await generateInvoicePDF(bill, profilePic);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice_${bill.memberId}.pdf`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF error:", error);
    res.status(500).json({ message: "PDF generation failed", error: error.message });
  }
});



// ---------------------
// 🧾 Create New Gym Bill
// ---------------------
router.post("/", upload.single("profilePicture"), async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0)
      return res.status(400).json({ message: "No data provided" });

   // 🔢 Auto-generate memberId
const lastMember = await GymBill.findOne({ memberId: { $regex: /^ONE2_/ } })
  .sort({ createdAt: -1 });

let memberId = "ONE2_5";

if (lastMember && lastMember.memberId) {
  const lastNumber = parseInt(lastMember.memberId.split("_")[1]) || 1;

  const newNumber = (lastNumber + 1).toString().padStart(4, "0");

  memberId = `ONE2_${newNumber}`;
}
    // Ensure valid status
    let status = req.body.status?.trim();
    if (!status || !["Active", "Inactive"].includes(status)) {
      status = "Active";
    }

    // -------------------------------
    // 📌 Calculate first bill values
    // -------------------------------
    const priceNum = Number(req.body.price) || 0;

    // ⭐ Read admissionCharges (frontend)
    const admissionCharges = Number(req.body.admissionCharges) || 0;

    const discountAmt = Number(req.body.discountAmount) || 0;
    const paidAmt = Number(req.body.amountPaid) || 0;

    // ⭐ Correct Balance Formula
    const firstBalance = priceNum + admissionCharges - discountAmt - paidAmt;

    // First renewal entry
    const firstRenewalEntry = {
      joiningDate: req.body.joiningDate,
      endDate: req.body.endDate,
      package: req.body.package,
      price: priceNum,
      admissionCharges: admissionCharges,
      discountAmount: discountAmt,
      amountPaid: paidAmt,
      balance: firstBalance,
      remarks: req.body.remarks,
      trainer: req.body.trainer,
    };

    // Handle Profile Picture
    let profilePicture = undefined;
    if (req.file) {
      const imageData = fs.readFileSync(req.file.path);
      profilePicture = {
        data: imageData,
        contentType: req.file.mimetype,
      };
      fs.unlinkSync(req.file.path);
    }

    // Create new bill
  const { memberId: _, ...rest } = req.body;

const newBill = new GymBill({
  ...rest,
  memberId,
  status,
  profilePicture,
  admissionCharges: admissionCharges,
  initialPaymentMode: req.body.initialPaymentMode,
  balance: firstBalance,
  discountAmount: discountAmt,
});

    await newBill.save();

    const profilePic = newBill.profilePicture?.data
  ? Buffer.from(newBill.profilePicture.data)
  : null;

if (newBill.email) {
  await sendInvoiceMail(
    newBill.email,
    newBill.client,
    newBill,
    profilePic
  );
}

    if (newBill.email) {
  await sendNewClientMail(
    newBill.email,
    newBill.client,
    newBill.memberId
  );
}

    res.status(201).json({
      message: "✅ Gym Bill Created Successfully",
      memberId: newBill.memberId,
      data: newBill,
    });
  } catch (error) {
    console.error("❌ Error creating gym bill:", error);
    res.status(500).json({ message: "Error creating gym bill", error: error.message });
  }
});

// ----------------
// 📜 Get All Bills
// ----------------
router.get("/", async (req, res) => {
  try {
    let bills = await GymBill.find().sort({ _id: -1 });

    bills = bills.map((bill) => {
      const renewalTotal = (bill.renewalHistory || []).reduce(
        (sum, r) => sum + (r.amountPaid || 0),
        0
      );

      const totalPaidIncludingRenewals =
        (bill.amountPaid || 0) + renewalTotal;

      return {
        ...bill._doc,
        totalPaidIncludingRenewals,
      };
    });

    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bills", error: error.message });
  }
});

// ------------------
// 🔁 Renew Membership
// ------------------
router.put("/renew/:id", async (req, res) => {
  try {
    const {
      joiningDate,
      endDate,
      package: pkg,
      price,
      admissionCharges,
      discountAmount,
      amountPaid,
      remarks,
      trainer,
      paymentMethod,
    } = req.body;

    const client = await GymBill.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });

    const previousCycle = {
      joiningDate: client.joiningDate,
      endDate: client.endDate,
      package: client.package,
      price: client.price,
      admissionCharges: client.admissionCharges,
      discountAmount: client.discountAmount,
      amountPaid: client.amountPaid,
      balance: client.balance,
      remarks: client.remarks,
      trainer: client.appointTrainer,
      modeOfPayment: client.modeOfPayment || client.initialPaymentMode,
    };

    const priceNum = Number(price) || 0;
    const adm = Number(admissionCharges) || 0;
    const disc = Number(discountAmount) || 0;
    const paid = Number(amountPaid) || 0;

    const newBalance = priceNum + adm - disc - paid;

    const updated = await GymBill.findByIdAndUpdate(
      req.params.id,
      {
        $push: { renewalHistory: previousCycle },
        joiningDate,
        endDate,
        package: pkg,
        price: priceNum,
        admissionCharges: adm,
        discountAmount: disc,
        amountPaid: paid,
        balance: newBalance,
        remarks,
        appointTrainer: trainer,
        modeOfPayment: paymentMethod,
        status: "Active",
      },
      { new: true }
    );

    // ✅ MOVE EMAIL HERE
    if (updated.email) {
      await sendRenewalMail(
        updated.email,
        updated.client,
        updated.endDate
      );
    }

    res.status(200).json({
      message: "Renewal updated successfully",
      data: updated,
    });

  } catch (err) {
    console.error("Renewal error:", err);
    res.status(500).json({ error: err.message });
  }
});




// ------------------
// ✏️ Edit Renewal Entry
// ------------------
router.put("/renew/edit/:clientId/:renewId", async (req, res) => {
  try {
    const { clientId, renewId } = req.params;

    const updateFields = req.body;

    const updated = await GymBill.updateOne(
      { _id: clientId, "renewalHistory._id": renewId },
      {
        $set: {
          "renewalHistory.$": {
            ...updateFields,
            _id: renewId,
          },
        },
      }
    );

    res.json({ message: "Renewal entry updated", data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------
// ✏️ Update Gym Bill
// -----------------
router.put("/:id", upload.single("profilePicture"), async (req, res) => {
  try {
    let updatedData = { ...req.body };

    if (req.file) {
      const imageData = fs.readFileSync(req.file.path);
      updatedData.profilePicture = {
        data: imageData,
        contentType: req.file.mimetype,
      };
      fs.unlinkSync(req.file.path);
    }

    if (!updatedData.status || !["Active", "Inactive"].includes(updatedData.status)) {
      updatedData.status = "Active";
    }

    const updated = await GymBill.findByIdAndUpdate(
  req.params.id,
  { $set: updatedData },
  { new: true, runValidators: true }
);


    res.json(updated);
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------
// ❌ Delete Gym Client
// -------------------
router.delete("/:id", async (req, res) => {
  try {
    await GymBill.findByIdAndDelete(req.params.id);
    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🗑 Delete Renewal Entry
router.delete("/renew/delete/:clientId/:renewId", async (req, res) => {
  try {
    const { clientId, renewId } = req.params;

    const updated = await GymBill.findByIdAndUpdate(
      clientId,
      { $pull: { renewalHistory: { _id: renewId } } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json({ message: "Renewal entry deleted", data: updated });
  } catch (err) {
    console.error("Error deleting renewal:", err);
    res.status(500).json({ message: "Deletion failed", error: err.message });
  }
});

// ---------------------------
// 💰 Update Payment + Followup
// ---------------------------
// ---------------------------
// 💰 Update Payment + Save History ALWAYS
// ---------------------------
router.put("/payment/:id", async (req, res) => {
  try {
    const { amountPaid, balance, mode, note, followUpDate } = req.body;

    // 1️⃣ Get old bill
    const oldBill = await GymBill.findById(req.params.id);
    if (!oldBill) return res.status(404).json({ message: "Client not found" });

    // 2️⃣ Calculate HOW MUCH was paid now
    const previousPaid = oldBill.amountPaid || 0;
    const newPaidTotal = Number(amountPaid);
    const paidNow = newPaidTotal - previousPaid;   // ⭐ ACTUAL PAYMENT

    // 3️⃣ Save payment entry
    const paymentEntry = {
      amount: paidNow,       // ⭐ STORE ONLY CURRENT PAYMENT
      mode,
      note: note || "",
      date: new Date(),
    };

    // 4️⃣ Update bill
    const updatedBill = await GymBill.findByIdAndUpdate(
      req.params.id,
      {
        amountPaid: newPaidTotal,
        balance,
        $push: { paymentHistory: paymentEntry },
      },
      { new: true }
    );

    // 5️⃣ Optional followup
    if (followUpDate) {
      await Followup.create({
        client: req.params.id,
        followupType: "Payment",
        scheduleDate: followUpDate,
        response: note || "Payment Follow-up",
        status: "Pending",
      });
    }

    return res.status(200).json({
      message: "Payment updated & history saved",
      data: updatedBill,
    });

  } catch (error) {
    console.error("❌ Payment update error:", error);
    res.status(500).json({ error: error.message });
  }
});



router.get("/", async (req, res) => {
  try {
    let bills = await GymBill.find().sort({ _id: -1 });

    bills = bills.map((bill) => {
      const renewalTotal = (bill.renewalHistory || []).reduce(
        (sum, r) => sum + (r.amountPaid || 0),
        0
      );

      const totalPaidIncludingRenewals =
        (bill.amountPaid || 0) + renewalTotal;

      // ⭐ FIX — include EVERYTHING in bill._doc INCLUDING paymentHistory
      return {
        ...bill._doc,
        paymentHistory: bill.paymentHistory,   // ⭐ add this
        renewalHistory: bill.renewalHistory,   // safe
        totalPaidIncludingRenewals,
      };
    });

    res.status(200).json(bills);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching bills", error: error.message });
  }
});


export default router;
