import { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Clock, X, Trash2, Edit } from "lucide-react";
import Select from "react-select/creatable";
import { API_URI } from "../api/api";

interface Client {
  _id: string;
  client: string;
}


interface Followup {
  _id?: string;
  client?: { _id: string; client: string };
  followupType: string;
  scheduleDate: string;
  scheduleTime?: string;
  response?: string;
  createdBy?: string;
  status: string;
}

const API_URL = `${API_URI}/followups`;
const CLIENT_API = `${API_URL}/gymbill`;

const FollowUp = () => {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFollowup, setEditingFollowup] = useState<Followup | null>(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filteredFollowups, setFilteredFollowups] = useState<Followup[]>([]);

  const [formData, setFormData] = useState({
    clientId: "",
    followupType: "",
    scheduleDate: "",
    scheduleTime: "",
    response: "",
    status: "Pending",
  });

  const clientOptions = clients.map((c) => ({
    value: c._id,
    label: c.client,
  }));

  const fetchClients = async () => {
    try {
      const res = await axios.get(CLIENT_API);
      setClients(res.data);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const fetchFollowups = async () => {
    try {
      const res = await axios.get(API_URL);
      setFollowups(res.data);
      setFilteredFollowups(res.data);
    } catch (err) {
      console.error("Error fetching followups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchFollowups();
  }, []);

  const followupOptions = [
    { value: "Anniversary", label: "Anniversary" },
    { value: "Balance", label: "Balance" },
    { value: "Billing", label: "Billing" },
    { value: "Birthday", label: "Birthday" },
    { value: "Enquiry", label: "Enquiry" },
    { value: "Renewal", label: "Renewal" },
  ];

  const applyFilter = () => {
    let filtered = [...followups];

    if (fromDate) {
      filtered = filtered.filter(
        (f) => new Date(f.scheduleDate) >= new Date(fromDate)
      );
    }

    if (toDate) {
      filtered = filtered.filter(
        (f) => new Date(f.scheduleDate) <= new Date(toDate)
      );
    }

    if (filterStatus) {
      filtered = filtered.filter((f) => f.status === filterStatus);
    }

    setFilteredFollowups(filtered);
  };

  const clearFilter = () => {
    setFromDate("");
    setToDate("");
    setFilterStatus("");
    setFilteredFollowups(followups);
  };

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.followupType || !formData.scheduleDate) {
      alert("Please fill all required fields!");
      return;
    }

    try {
      if (editingFollowup) {
        await axios.put(`${API_URL}/${editingFollowup._id}/status`, {
          status: formData.status,
        });
      } else {
        await axios.post(API_URL, {
          clientId: formData.clientId,
          followupType: formData.followupType,
          scheduleDate: formData.scheduleDate,
          scheduleTime: formData.scheduleTime,
          response: formData.response,
          createdBy: "admin",
        });
      }

      fetchFollowups();
      setShowModal(false);
      setEditingFollowup(null);
      setFormData({
        clientId: "",
        followupType: "",
        scheduleDate: "",
        scheduleTime: "",
        response: "",
        status: "Pending",
      });
    } catch (err) {
      console.error("Error saving followup:", err);
      alert("Error saving followup!");
    }
  };

  const handleEdit = (followup: Followup) => {
    setEditingFollowup(followup);
    setFormData({
      clientId: followup.client?._id || "",
      followupType: followup.followupType,
      scheduleDate: new Date(followup.scheduleDate).toISOString().split("T")[0],
      scheduleTime: followup.scheduleTime || "",
      response: followup.response || "",
      status: followup.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this follow-up?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchFollowups();
    } catch (err) {
      console.error("Error deleting followup:", err);
      alert("Error deleting followup!");
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen text-sm">
      <h2 className="text-xl font-bold mb-6 bg-yellow-400 text-gray-900 px-5 py-3 rounded-lg shadow">
        Follow-Up Records
      </h2>

      {/* Create Button */}
      <div className="mb-5">
        <button
          onClick={() => {
            setEditingFollowup(null);
            setFormData({
              clientId: "",
              followupType: "",
              scheduleDate: "",
              scheduleTime: "",
              response: "",
              status: "Pending",
            });
            setShowModal(true);
          }}
          className="bg-yellow-400 text-gray-900 px-5 py-2 rounded-md font-semibold shadow hover:bg-yellow-500 transition"
        >
          + Create Followup
        </button>
      </div>

      {/* Filter Section */}
      {followups.length > 0 && (
        <div className="flex flex-wrap gap-3 items-end mb-5 bg-yellow-50 p-4 rounded-lg shadow-inner">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded-md px-3 py-2 bg-white focus:outline-yellow-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded-md px-3 py-2 bg-white focus:outline-yellow-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-md px-3 py-2 bg-white focus:outline-yellow-400"
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyFilter}
              className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-md font-semibold shadow hover:bg-yellow-500 transition"
            >
              Apply
            </button>
            <button
              onClick={clearFilter}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-400 transition"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow">
        <table className="w-full text-sm">
          <thead className="bg-yellow-100">
            <tr className="text-left text-gray-700">
              <th className="p-3">S.No</th>
              <th className="p-3">Client Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center p-5 text-gray-500">
                  Loading followups...
                </td>
              </tr>
            ) : filteredFollowups.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-5 text-gray-500">
                  No followups found.
                </td>
              </tr>
            ) : (
              filteredFollowups.map((f, index) => (
                <tr key={f._id} className="border-t hover:bg-yellow-50 transition">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{f.client?.name || f.client?.client || "N/A"}</td>
                  <td className="p-3">{f.followupType}</td>
                  <td className="p-3">
                    {new Date(f.scheduleDate).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        f.status === "Pending"
                          ? "bg-yellow-300 text-gray-800"
                          : "bg-green-300 text-green-900"
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(f)}
                      className="px-2 py-1 bg-blue-400 text-white rounded hover:bg-blue-500 flex items-center gap-1"
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      onClick={() => f._id && handleDelete(f._id)}
                      className="px-2 py-1 bg-red-400 text-white rounded hover:bg-red-500 flex items-center gap-1"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-yellow-50 rounded-xl shadow-lg w-full max-w-xl p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              <X size={22} />
            </button>

            <h3 className="text-lg font-bold mb-5 text-gray-800">
              {editingFollowup ? "Edit Follow-Up" : "Create Follow-Up"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block mb-1 text-gray-600 font-medium">
                  Client *
                </label>
                <Select
                  isClearable
                  isDisabled={!!editingFollowup}
                  options={clientOptions}
                  value={
                    formData.clientId
                      ? clientOptions.find((c) => c.value === formData.clientId)
                      : null
                  }
                  onChange={(selected: any) =>
                    setFormData({ ...formData, clientId: selected?.value || "" })
                  }
                  placeholder="Select a client"
                  classNamePrefix="react-select"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-600 font-medium">
                  Follow-up Type *
                </label>
                <Select
                  isClearable
                  isDisabled={!!editingFollowup}
                  options={followupOptions}
                  value={
                    formData.followupType
                      ? { value: formData.followupType, label: formData.followupType }
                      : null
                  }
                  onChange={(selected: any) =>
                    setFormData({ ...formData, followupType: selected?.value || "" })
                  }
                  placeholder="Select type"
                  classNamePrefix="react-select"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-600 font-medium">
                  Schedule Date *
                </label>
                <div className="flex items-center border rounded-md bg-yellow-50 px-3 py-2 focus-within:border-yellow-400">
                  <Calendar size={16} className="text-gray-500 mr-2" />
                  <input
                    type="date"
                    value={formData.scheduleDate}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduleDate: e.target.value })
                    }
                    className="flex-1 bg-yellow-50 outline-none text-sm"
                    disabled={!!editingFollowup}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-gray-600 font-medium">
                  Schedule Time
                </label>
                <div className="flex items-center border rounded-md bg-yellow-50 px-3 py-2 focus-within:border-yellow-400">
                  <Clock size={16} className="text-gray-500 mr-2" />
                  <input
                    type="time"
                    value={formData.scheduleTime}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduleTime: e.target.value })
                    }
                    className="flex-1 bg-yellow-50 outline-none text-sm"
                    disabled={!!editingFollowup}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1 text-gray-600 font-medium">
                  Response / Feedback
                </label>
                <textarea
                  value={formData.response}
                  onChange={(e) =>
                    setFormData({ ...formData, response: e.target.value })
                  }
                  placeholder="Enter feedback"
                  className="w-full border rounded-md px-3 py-2 h-20 bg-yellow-50 text-sm focus:outline-yellow-400"
                />
              </div>

              {editingFollowup && (
                <div className="md:col-span-2">
                  <label className="block mb-1 text-gray-600 font-medium">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2 bg-yellow-50 text-sm focus:outline-yellow-400"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              className="mt-6 w-full bg-yellow-400 text-gray-900 font-bold py-2 rounded-md hover:bg-yellow-500 transition text-sm"
            >
              {editingFollowup ? "Update Follow-Up" : "Add Follow-Up"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUp;
