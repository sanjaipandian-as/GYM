import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, PackagePlus, Pencil } from "lucide-react";
import { API_URI } from "../api/api";

interface PackageData {
  _id?: string;
  packageName: string;
  days: number;
  price: number;
}

const API_URL = `${API_URI}/packages`; // ✅ Replace with your backend URL

const Packages: React.FC = () => {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [formData, setFormData] = useState<PackageData>({
    packageName: "",
    days: 0,
    price: 0,
  });

  // Popup edit state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState<PackageData>({
    _id: "",
    packageName: "",
    days: 0,
    price: 0,
  });

  const fetchPackages = async () => {
    const res = await axios.get(API_URL);
    setPackages(res.data);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddPackage = async () => {
    if (!formData.packageName || formData.days <= 0 || formData.price <= 0) return;
    await axios.post(API_URL, formData);
    setFormData({ packageName: "", days: 0, price: 0 });
    fetchPackages();
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    await axios.delete(`${API_URL}/${id}`);
    fetchPackages();
  };

  // ====== Edit Popup Handlers ======
  const openEditPopup = (pkg: PackageData) => {
    setEditData(pkg);
    setIsEditOpen(true);
  };

  const closeEditPopup = () => {
    setIsEditOpen(false);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (!editData._id) return;
    await axios.put(`${API_URL}/${editData._id}`, editData);
    setIsEditOpen(false);
    fetchPackages();
  };

  return (
    <div className="min-h-screen bg-white p-8 text-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#000000] tracking-wide">
          🏋️‍♀️ Manage Gym Packages
        </h2>
        <div className="h-1 w-32 bg-yellow-400 rounded-full"></div>
      </div>

      {/* Form Card */}
      <div className="bg-yellow-50 p-6 rounded-2xl shadow-md border border-yellow-200 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-yellow-800 flex items-center gap-2">
          <PackagePlus size={20} /> Add New Package
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Package Name</label>
            <input
              type="text"
              name="packageName"
              placeholder="Enter package name"
              value={formData.packageName}
              onChange={handleChange}
              className="border border-yellow-300 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 p-2 rounded-md outline-none transition"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Days</label>
            <input
              type="number"
              name="days"
              placeholder="Enter duration in days"
              value={formData.days}
              onChange={handleChange}
              className="border border-yellow-300 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 p-2 rounded-md outline-none transition"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input
              type="number"
              name="price"
              placeholder="Enter package price"
              value={formData.price}
              onChange={handleChange}
              className="border border-yellow-300 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-400 p-2 rounded-md outline-none transition"
            />
          </div>
        </div>

        <button
          onClick={handleAddPackage}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md font-medium transition flex items-center gap-2"
        >
          <PackagePlus size={18} /> Add Package
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <h3 className="bg-yellow-100 text-yellow-800 px-6 py-3 font-semibold text-lg">
          📦 Package List
        </h3>
        <table className="w-full border-t border-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Days</th>
              <th className="px-6 py-3 text-left">Price</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-400">
                  No packages found. Add a new one above!
                </td>
              </tr>
            ) : (
              packages.map((pkg) => (
                <tr
                  key={pkg._id}
                  className="hover:bg-yellow-50 transition border-b border-gray-100"
                >
                  <td className="px-6 py-3">{pkg.packageName}</td>
                  <td className="px-6 py-3">{pkg.days} days</td>
                  <td className="px-6 py-3 font-medium text-yellow-700">₹{pkg.price}</td>
                  <td className="px-6 py-3 text-center flex justify-center gap-4">
                    <button
                      onClick={() => openEditPopup(pkg)}
                      className="text-blue-500 hover:text-blue-700 transition"
                      title="Edit package"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg._id)}
                      className="text-red-500 hover:text-red-700 transition"
                      title="Delete package"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Edit Popup Modal ===== */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-md relative">
            <h3 className="text-lg font-semibold mb-4 text-yellow-800">✏️ Edit Package</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                name="packageName"
                value={editData.packageName}
                onChange={handleEditChange}
                className="border border-gray-300 p-2 rounded-md"
                placeholder="Package name"
              />
              <input
                type="number"
                name="days"
                value={editData.days}
                onChange={handleEditChange}
                className="border border-gray-300 p-2 rounded-md"
                placeholder="Days"
              />
              <input
                type="number"
                name="price"
                value={editData.price}
                onChange={handleEditChange}
                className="border border-gray-300 p-2 rounded-md"
                placeholder="Price"
              />
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={closeEditPopup}
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 rounded-md bg-yellow-500 hover:bg-yellow-600 text-white transition"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
