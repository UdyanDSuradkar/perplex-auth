"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { data: session, status, update } = useSession();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
    if (session?.user) {
      setName(session.user.name || "");
      setAvatarUrl(session.user.image || "");
    }
  }, [session, status, router]);

  const handleUpdate = async () => {
    if (!name.trim()) {
      alert("Name is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          avatarUrl: avatarUrl.trim(),
        }),
      });

      if (response.ok) {
        await update({
          name: name.trim(),
          image: avatarUrl.trim(),
        });

        setEditing(false);
        alert("Profile updated successfully!");
      } else {
        const errorText = await response.text();
        alert(`Update failed: ${errorText}`);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Update failed due to network error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(session?.user?.name || "");
    setAvatarUrl(session?.user?.image || "");
    setEditing(false);
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Determine auth type from session data
  const authType =
    session.user.image && !session.user.image.includes("default")
      ? "OAuth"
      : "Email/Password";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-black">
                User Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {session.user.name || "User"}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-black">
            Profile Information
          </h2>

          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <img
                src={session.user.image || "/default-avatar.png"}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/default-avatar.png";
                }}
              />
              <div>
                <p className="text-sm text-gray-500">Avatar</p>
                <p className="font-medium text-black">
                  {session.user.image ? "Custom Avatar" : "Default"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Name</p>
                {editing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className=" text-black block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your name"
                    maxLength={100}
                  />
                ) : (
                  <p className="font-medium text-black">
                    {session.user.name || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium text-gray-900">
                  {session.user.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Role</p>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    session.user.role === "admin"
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {session.user.role || "user"}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Authentication Method
                </p>
                <p className="font-medium text-gray-900">{authType}</p>
              </div>
            </div>

            {editing && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Avatar URL</p>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className=" text-black block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter a valid URL for your profile picture
                </p>
              </div>
            )}

            <div className="flex space-x-4 pt-4 border-t border-gray-200">
              {editing ? (
                <>
                  <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
