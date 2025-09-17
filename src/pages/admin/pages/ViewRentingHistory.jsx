import React, { useState } from "react";
import Swal from "sweetalert2";
import AdminLayout from "../../../components/AdminLayout";
import { useUser } from "../../../hooks/useUser";

function ViewRentingHistory() {
  const user = useUser();

  // Rentals stored in state (replace with API later)
  const [rentals, setRentals] = useState([
    {
      id: "#AHGA68",
      date: "2022-09-23",
      item: "Chain Saw",
      status: "Completed",
    },
    {
      id: "#AHGA68",
      date: "2022-09-23",
      item: "Calculator",
      status: "Completed",
    },
    {
      id: "#AHGA68",
      date: "2022-09-23",
      item: "Darna Costume",
      status: "Completed",
    },
    { id: "#AHGA68", date: "2022-09-23", item: "Jag", status: "Completed" },
    { id: "#AHGA68", date: "2022-09-23", item: "Drum Set", status: "Pending" },
    {
      id: "#AHGA68",
      date: "2022-09-23",
      item: "Acoustic Guitar",
      status: "Ongoing",
    },
    {
      id: "#AHGA68",
      date: "2022-09-23",
      item: "Uno Cards",
      status: "Cancelled",
    },
    {
      id: "#AHGA68",
      date: "2022-09-23",
      item: "Grass Cutter",
      status: "Pending",
    },
    {
      id: "#AHGA68",
      date: "2022-09-23",
      item: "Room for 2",
      status: "Completed",
    },
  ]);

  // Filters state
  const [filters, setFilters] = useState({
    item: "",
    id: "",
    date: "",
  });

  // Delete rental with SweetAlert
  const handleDelete = (index) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This record will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedRentals = rentals.filter((_, i) => i !== index);
        setRentals(updatedRentals);

        Swal.fire("Deleted!", "The record has been removed.", "success");
      }
    });
  };

  // Apply filters
  const filteredRentals = rentals.filter((rental) => {
    return (
      (filters.item === "" ||
        rental.item.toLowerCase().includes(filters.item.toLowerCase())) &&
      (filters.id === "" ||
        rental.id.toLowerCase().includes(filters.id.toLowerCase())) &&
      (filters.date === "" || rental.date === filters.date)
    );
  });

  return (
    <AdminLayout className="bg-[#FFFBF2] min-h-screen p-6">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {user?.first_name || "Admin"}
        </h1>
        <p className="mt-1 text-gray-600">Renting History</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Enter Item Name"
          value={filters.item}
          onChange={(e) => setFilters({ ...filters, item: e.target.value })}
          className="px-3 py-2 border rounded-md w-1/4"
        />
        <input
          type="text"
          placeholder="Enter Rental ID"
          value={filters.id}
          onChange={(e) => setFilters({ ...filters, id: e.target.value })}
          className="px-3 py-2 border rounded-md w-1/4"
        />
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="px-3 py-2 border rounded-md w-1/4"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3">
                <input type="checkbox" />
              </th>
              <th className="p-3">Rental ID</th>
              <th className="p-3">Renting Start Date</th>
              <th className="p-3">Item Name</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            {filteredRentals.length > 0 ? (
              filteredRentals.map((rental, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-3">
                    <input type="checkbox" />
                  </td>
                  <td className="p-3 text-orange-500 font-semibold">
                    {rental.id}
                  </td>
                  <td className="p-3">
                    {new Date(rental.date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="p-3">{rental.item}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium
                        ${
                          rental.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : rental.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : rental.status === "Ongoing"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                    >
                      {rental.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDelete(index)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No rentals found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export default ViewRentingHistory;
