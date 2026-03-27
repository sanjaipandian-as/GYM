import { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, PlusCircle, Filter } from "lucide-react";
import { API_URI } from "../api/api";

const API_URL = `${API_URI}/expenses`;

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: "",
    category: "Rent",
    amount: "",
    paymentMode: "Cash",
    notes: "",
  });

  const [filters, setFilters] = useState({
    category: "All",
    paymentMode: "All",
    fromDate: "",
    toDate: "",
  });

  const fetchExpenses = async () => {
    const res = await axios.get(API_URL);
    setExpenses(res.data);
    setFilteredExpenses(res.data);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  /* 🔍 Filter Logic */
  useEffect(() => {
    let data = [...expenses];

    if (filters.category !== "All") {
      data = data.filter((e) => e.category === filters.category);
    }

    if (filters.paymentMode !== "All") {
      data = data.filter((e) => e.paymentMode === filters.paymentMode);
    }

    if (filters.fromDate) {
      data = data.filter(
        (e) => new Date(e.expenseDate) >= new Date(filters.fromDate)
      );
    }

    if (filters.toDate) {
      data = data.filter(
        (e) => new Date(e.expenseDate) <= new Date(filters.toDate)
      );
    }

    setFilteredExpenses(data);
  }, [filters, expenses]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await axios.post(API_URL, form);
    setForm({
      title: "",
      category: "Rent",
      amount: "",
      paymentMode: "Cash",
      notes: "",
    });
    fetchExpenses();
  };

  const deleteExpense = async (id: string) => {
    await axios.delete(`${API_URL}/${id}`);
    fetchExpenses();
  };

  const totalAmount = filteredExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );
return (
  <div className="p-4 md:p-6 space-y-6">

    {/* Header */}
    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 md:p-5 rounded-lg text-white shadow">
      <h2 className="text-lg md:text-2xl font-bold">💰 Expense Management</h2>
      <p className="text-xs md:text-sm opacity-90">
        Track & filter your gym expenses easily
      </p>
    </div>

    {/* Filters */}
    <div className="bg-white p-4 rounded-lg shadow space-y-3">
      <div className="flex items-center gap-2 text-yellow-600 font-semibold">
        <Filter size={18} /> Filters
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">

        <select className="border p-2 rounded w-full">
          <option>All Categories</option>
        </select>

        <select className="border p-2 rounded w-full">
          <option>All Payments</option>
        </select>

        <input type="date" className="border p-2 rounded w-full" />
        <input type="date" className="border p-2 rounded w-full" />

        <button className="w-full bg-yellow-500 text-white rounded">
          Clear
        </button>

      </div>
    </div>

    {/* Add Expense */}
    <form className="bg-white p-4 rounded-lg shadow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">

      <input className="border p-2 rounded" placeholder="Title" />

      <select className="border p-2 rounded">
        <option>Category</option>
      </select>

      <input type="number" className="border p-2 rounded" placeholder="Amount" />

      <select className="border p-2 rounded">
        <option>Payment Mode</option>
      </select>

      <button className="w-full md:w-auto bg-yellow-500 text-white rounded flex justify-center items-center gap-2">
        <PlusCircle size={18} /> Add
      </button>

      <textarea className="border p-2 rounded md:col-span-3" placeholder="Notes" />

    </form>

    {/* Summary */}
    <div className="bg-yellow-50 p-4 rounded-lg font-semibold text-yellow-800">
      Total Expense: ₹ {totalAmount}
    </div>

    {/* ================= DESKTOP TABLE ================= */}
    <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-yellow-100">
          <tr>
            <th className="p-3 text-left">Title</th>
            <th className="p-3 text-center">Category</th>
            <th className="p-3 text-center">Amount</th>
            <th className="p-3 text-center">Payment</th>
            <th className="p-3 text-center">Date</th>
            <th className="p-3 text-center">Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredExpenses.map((exp) => (
            <tr key={exp._id} className="border-t hover:bg-yellow-50">
              <td className="p-2">{exp.title}</td>
              <td className="p-2 text-center">{exp.category}</td>
              <td className="p-2 text-center text-yellow-600">₹{exp.amount}</td>
              <td className="p-2 text-center">{exp.paymentMode}</td>
              <td className="p-2 text-center">
                {new Date(exp.expenseDate).toLocaleDateString()}
              </td>
              <td className="p-2 text-center">
                <button className="text-red-500">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* ================= MOBILE CARDS ================= */}
    <div className="md:hidden space-y-4">

      {filteredExpenses.length === 0 ? (
        <p className="text-center text-gray-500">No expenses found</p>
      ) : (
        filteredExpenses.map((exp) => (
          <div key={exp._id} className="bg-white p-4 rounded-lg shadow">

            <h3 className="font-semibold">{exp.title}</h3>

            <p className="text-xs text-gray-600">{exp.category}</p>

            <p className="text-yellow-600 font-semibold">
              ₹{exp.amount}
            </p>

            <p className="text-xs">{exp.paymentMode}</p>

            <p className="text-xs">
              {new Date(exp.expenseDate).toLocaleDateString()}
            </p>

            <button className="mt-3 w-full bg-red-500 text-white py-2 rounded">
              Delete
            </button>

          </div>
        ))
      )}

    </div>

  </div>
);
}
