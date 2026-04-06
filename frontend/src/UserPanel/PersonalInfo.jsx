import React from "react";

export default function PersonalInfo({ user }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h2 className="font-bold text-xl mb-4">Personal Information</h2>

      <p><strong>Full Name:</strong> {user.name} {user.lastname}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Gender:</strong> {user.gender}</p>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>Address:</strong> {user.address}</p>
    </div>
  );
}
