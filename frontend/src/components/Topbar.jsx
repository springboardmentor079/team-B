import { Bell, ChevronDown, MapPin, Menu, Mail, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  getMyNotifications,
  markAllNotificationsRead,
} from "../services/notificationService";

export default function Topbar({ onMenuClick }) {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);

  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setUser(null);
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (err) {
      console.error("Invalid user data in localStorage");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  useEffect(() => {
    loadUserFromStorage();
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleStorageSync = () => {
      loadUserFromStorage();
      fetchNotifications();
    };

    window.addEventListener("storage", handleStorageSync);
    window.addEventListener("user-updated", handleStorageSync);

    return () => {
      window.removeEventListener("storage", handleStorageSync);
      window.removeEventListener("user-updated", handleStorageSync);
    };
  }, []);

  const verificationLabelMap = {
    verified: "Verification Complete",
    pending: "Verification Pending",
    rejected: "Verification Rejected",
    unverified: "Verification Not Started",
  };

  const verificationStatusText =
    verificationLabelMap[user?.verificationStatus] || "Verification Not Started";
  const showVerificationStatus = user?.role === "official";
  const showNotifications = user?.role === "citizen";

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token || user?.role !== "citizen") {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setNotifLoading(true);
      const res = await getMyNotifications(10);
      const nextNotifications = res.data?.notifications || [];
      const nextUnreadCount = res.data?.unreadCount || 0;
      setNotifications(nextNotifications);
      setUnreadCount(nextUnreadCount);
      return { notifications: nextNotifications, unreadCount: nextUnreadCount };
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      return { notifications: [], unreadCount: 0 };
    } finally {
      setNotifLoading(false);
    }
  };

  const formatTime = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.role === "citizen") {
      fetchNotifications();
    } else {
      setNotifOpen(false);
      setNotifications([]);
      setUnreadCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const handleNotificationClick = async () => {
    if (!showNotifications) return;

    const nextState = !notifOpen;
    setNotifOpen(nextState);
    setOpen(false);

    if (!nextState) return;

    const latest = await fetchNotifications();

    if ((latest?.unreadCount || 0) > 0) {
      try {
        await markAllNotificationsRead();
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((item) => ({ ...item, read: true }))
        );
      } catch (err) {
        console.error("Failed to mark notifications as read", err);
      }
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          aria-label="Open navigation menu"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 tracking-tight">
          Civix
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 relative" ref={menuRef}>
        {showNotifications ? (
          <button
            type="button"
            onClick={handleNotificationClick}
            className="relative p-2 rounded-lg hover:bg-gray-100"
            aria-label="Open notifications"
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
        ) : null}

        {/* User */}
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setNotifOpen(false);
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
        >
          
          {/* Avatar */}
          <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          {/* Name + Role */}
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-sm font-medium text-gray-800">
              {user?.name || "User"}
            </span>
            <span className="text-xs text-gray-500 capitalize">
              {user?.role || "role"}
            </span>
            {showVerificationStatus ? (
              <span className="text-[11px] text-gray-500">
                {verificationStatusText}
              </span>
            ) : null}
          </div>

          <ChevronDown size={16} className="text-gray-500" />
        </button>

        {showNotifications && notifOpen && (
          <div className="absolute right-20 top-14 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">Notifications</p>
              <span className="text-xs text-gray-500">Latest</span>
            </div>

            <div className="max-h-80 overflow-y-auto mt-2 space-y-2 pr-1">
              {notifLoading ? (
                <p className="text-sm text-gray-500 px-2 py-2">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="text-sm text-gray-500 px-2 py-2">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item._id}
                    className={`rounded-lg border px-3 py-2 ${
                      item.read ? "bg-white border-gray-200" : "bg-blue-50 border-blue-100"
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.message}</p>
                    {item?.metadata?.comment ? (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        Comment: {item.metadata.comment}
                      </p>
                    ) : null}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {formatTime(item.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {open && (
          <div className="absolute right-0 top-14 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {user?.role || "role"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Mail size={16} className="mt-0.5 text-gray-400" />
                <span className="break-all">
                  {user?.email || "No email"}
                </span>
              </div>
              {showVerificationStatus ? (
                <div className="flex items-start gap-2">
                  <Shield size={16} className="mt-0.5 text-gray-400" />
                  <span>
                    {verificationStatusText}
                  </span>
                </div>
              ) : null}
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 text-gray-400" />
                <span>
                  {user?.location?.jurisdiction?.city ||
                    user?.location?.address ||
                    "Location not set"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
