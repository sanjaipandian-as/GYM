import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { API_URI } from "../api/api";

interface Trainer {
  _id?: string;
  name: string;
  contactNumber: string;
  email: string;
  specialization?: string;
  experience: number;
}

export default function TrainerPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [formData, setFormData] = useState<Trainer>({
    name: "",
    contactNumber: "",
    email: "",
    specialization: "",
    experience: 0,
  });
  const [message, setMessage] = useState("");
  const [editTrainer, setEditTrainer] = useState<Trainer | null>(null); // For modal

  const fetchTrainers = async () => {
    try {
      const res = await axios.get<Trainer[]>(`${API_URI}/trainers`);
      setTrainers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setTrainers([]);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "experience" ? Number(value) : value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editTrainer) {
        await axios.put(`${API_URI}/trainers/${editTrainer._id}`, formData);
        setMessage("Trainer updated successfully!");
        setEditTrainer(null);
      } else {
        await axios.post(`${API_URI}/trainers`, formData);
        setMessage("Trainer added successfully!");
      }
      setFormData({ name: "", contactNumber: "", email: "", specialization: "", experience: 0 });
      fetchTrainers();
    } catch (err) {
      console.error(err);
      setMessage(editTrainer ? "Failed to update trainer." : "Failed to add trainer.");
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    try {
      await axios.delete(`${API_URI}/trainers/${id}`);
      setMessage("Trainer deleted successfully!");
      fetchTrainers();
    } catch (err) {
      console.error(err);
      setMessage("Failed to delete trainer.");
    }
  };

  const handleEdit = (trainer: Trainer) => {
    setEditTrainer(trainer);
    setFormData({
      name: trainer.name,
      contactNumber: trainer.contactNumber,
      email: trainer.email,
      specialization: trainer.specialization || "",
      experience: trainer.experience,
    });
    setMessage("");
  };

  const closeModal = () => {
    setEditTrainer(null);
    setFormData({ name: "", contactNumber: "", email: "", specialization: "", experience: 0 });
  };

  return (
    <div className="p-6 w-full overflow-auto text-sm">
      <h2 className="text-2xl font-semibold mb-4 text-yellow-600">Trainer Details</h2>

      {message && <p className="mb-4 text-green-600">{message}</p>}

      {/* ------------------ Add Trainer Form ------------------ */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl mb-6 shadow-md border border-yellow-300">
        <h3 className="text-xl font-bold mb-4 text-yellow-600">Add Trainer</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter name"
              className="p-2 border rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Contact Number</label>
            <input
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="Enter contact number"
              className="p-2 border rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              className="p-2 border rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Specialization</label>
            <input
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              placeholder="Enter specialization"
              className="p-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Experience (years)</label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder="Enter experience"
              className="p-2 border rounded w-full"
              min={0}
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
        >
          Add Trainer
        </button>
      </form>

      {/* ------------------ Trainer List ------------------ */}
      <table className="min-w-full border border-gray-200">
        <thead className="bg-yellow-100 text-yellow-800">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Contact</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Specialization</th>
            <th className="p-2 border">Experience</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(trainers) && trainers.length > 0 ? (
            trainers.map((t) => (
              <tr key={t._id} className="text-center hover:bg-yellow-50">
                <td className="p-2 border">{t.name}</td>
                <td className="p-2 border">{t.contactNumber}</td>
                <td className="p-2 border">{t.email}</td>
                <td className="p-2 border">{t.specialization}</td>
                <td className="p-2 border">{t.experience}</td>
                <td className="p-2 border flex justify-center gap-2">
                  <button
                    onClick={() => handleEdit(t)}
                    className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="p-2 border text-center" colSpan={6}>
                No trainers found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ------------------ Edit Modal ------------------ */}
      {editTrainer && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-lg border-2 border-yellow-400">
            <h3 className="text-xl font-bold mb-4 text-yellow-600">Edit Trainer</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
              <div>
                <label className="block mb-1 font-medium">Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter name"
                  className="p-2 border rounded w-full"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Contact Number</label>
                <input
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="Enter contact number"
                  className="p-2 border rounded w-full"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Email</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  className="p-2 border rounded w-full"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Specialization</label>
                <input
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="Enter specialization"
                  className="p-2 border rounded w-full"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Experience</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="Enter experience"
                  className="p-2 border rounded w-full"
                  min={0}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
