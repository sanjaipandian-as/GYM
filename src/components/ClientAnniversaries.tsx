import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Calendar,
  Phone,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { API_URI } from "../api/api";

interface Client {
  _id: string;
  memberId: string;
  client: string;
  anniversary?: string;
  gender?: string;
  contactNumber?: string;
}

const ClientAnniversaries: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);
  const [gender, setGender] = useState("");
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const API_URL = `${API_URI}/gymbill`;

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data } = await axios.get(API_URL);
      const anniversaryClients = data.filter(
        (c: Client) => c.anniversary && c.anniversary.trim() !== ""
      );
      setClients(anniversaryClients);
      setFiltered(anniversaryClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  // ✅ Handle filtering by gender, search, and anniversary date range
  const handleFilter = () => {
    let filteredList = [...clients];

    // 🔍 Search
    if (search) {
      const s = search.toLowerCase();
      filteredList = filteredList.filter(
        (c) =>
          c.client?.toLowerCase().includes(s) ||
          c.contactNumber?.toLowerCase().includes(s)
      );
    }

    // 🚻 Gender
    if (gender) {
      filteredList = filteredList.filter(
        (c) => c.gender?.toLowerCase() === gender.toLowerCase()
      );
    }

    // 📅 From–To date filter (ignore year)
    if (fromDate || toDate) {
      filteredList = filteredList.filter((c) => {
        if (!c.anniversary) return false;
        const annivDate = new Date(c.anniversary);
        if (isNaN(annivDate.getTime())) return false;

        const annivKey = (annivDate.getMonth() + 1) * 100 + annivDate.getDate();

        const fromKey =
          fromDate !== ""
            ? (new Date(fromDate).getMonth() + 1) * 100 +
              new Date(fromDate).getDate()
            : null;

        const toKey =
          toDate !== ""
            ? (new Date(toDate).getMonth() + 1) * 100 +
              new Date(toDate).getDate()
            : null;

        if (fromKey !== null && toKey !== null) {
          if (fromKey <= toKey) {
            return annivKey >= fromKey && annivKey <= toKey;
          } else {
            // Handles wrap-around range (e.g., Dec → Jan)
            return annivKey >= fromKey || annivKey <= toKey;
          }
        } else if (fromKey !== null) {
          return annivKey >= fromKey;
        } else if (toKey !== null) {
          return annivKey <= toKey;
        }
        return true;
      });
    }

    setFiltered(filteredList);
    setPage(1);
  };

  useEffect(() => {
    handleFilter();
  }, [gender, search, fromDate, toDate]);

  // Pagination logic
  const startIndex = (page - 1) * entries;
  const endIndex = startIndex + entries;
  const paginated = filtered.slice(startIndex, endIndex);

  const totalPages = Math.ceil(filtered.length / entries);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const resetFilters = () => {
    setGender("");
    setSearch("");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen text-sm">
      {/* Header */}
      <div className="bg-yellow-400 text-white px-6 py-4 rounded-t-xl shadow-md flex items-center gap-3">
        <Calendar size={20} className="text-black" />
        <h1 className="text-xl font-semibold">Client Anniversaries</h1>
      </div>

      {/* Main Container */}
      <div className="bg-white p-6 rounded-b-xl shadow-lg">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          
          {/* 📅 From Date */}
          <div>
            <label className="text-xs text-gray-600">From </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
            />
          </div>

          {/* 📅 To Date */}
          <div>
            <label className="text-xs text-gray-600">To </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
            />
          </div>

          {/* 🔍 Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search name or contact number..."
              className="border rounded-md pl-8 pr-3 py-2 w-full text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* 🔁 Reset */}
          <button
            onClick={resetFilters}
            className="bg-gray-300 hover:bg-gray-400 px-3 py-2 rounded-md text-sm"
          >
            Reset
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-yellow-50 text-gray-700 font-semibold">
                <th className="p-3 border">Member ID</th>
                <th className="p-3 border">Client Name</th>
                <th className="p-3 border">Anniversary Date</th>
                <th className="p-3 border">Gender</th>
                <th className="p-3 border">Contact</th>
                <th className="p-3 border text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-yellow-50 transition-colors border-b"
                  >
                    <td className="p-3 border text-gray-700">{c.memberId}</td>
                    <td className="p-3 border font-medium capitalize text-gray-800">
                      {c.client}
                    </td>
                    <td className="p-3 border text-gray-600">
                      {formatDate(c.anniversary)}
                    </td>
                    <td className="p-3 border capitalize text-gray-600">
                      {c.gender || "-"}
                    </td>
                    <td className="p-3 border text-gray-700 flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      {c.contactNumber}
                    </td>
                    <td className="p-3 border text-center">
                      <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded-md text-sm transition">
                        Wish 🎉
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No anniversary clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6 text-sm">
          <p className="text-gray-600">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filtered.length)} of {filtered.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className={`flex items-center gap-1 border px-3 py-1 rounded-md ${
                page === 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-yellow-50"
              }`}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(page + 1)}
              className={`flex items-center gap-1 border px-3 py-1 rounded-md ${
                page === totalPages || totalPages === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-yellow-50"
              }`}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAnniversaries;
