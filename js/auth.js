/**
 * Absensi Santri - Authentication Module
 * Handles user registration, login, and session management
 */

var AuthModule = (function () {
  'use strict';

  var USERS_KEY = 'absensi_users';
  var CURRENT_USER_KEY = 'absensi_current_user';

  // Default admin account
  var defaultUsers = [
    {
      id: 1,
      name: 'Ahmad Ramadhan',
      email: 'admin@akamid.com',
      password: 'admin123',
      role: 'admin',
      avatar: 'A',
      createdAt: new Date().toISOString()
    }
  ];

  // --- Load users from localStorage ---
  function loadUsers() {
    try {
      var data = localStorage.getItem(USERS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('[Auth] Failed to load users:', e);
    }
    // Seed default users
    saveUsers(defaultUsers);
    return defaultUsers;
  }

  // --- Save users to localStorage ---
  function saveUsers(users) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('[Auth] Failed to save users:', e);
    }
  }

  // --- Get current logged in user ---
  function getCurrentUser() {
    try {
      var data = localStorage.getItem(CURRENT_USER_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('[Auth] Failed to get current user:', e);
    }
    return null;
  }

  // --- Set current user ---
  function setCurrentUser(user) {
    try {
      // Don't store password in session
      var sessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
    } catch (e) {
      console.warn('[Auth] Failed to set current user:', e);
    }
  }

  // --- Clear current user (logout) ---
  function clearCurrentUser() {
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch (e) {
      console.warn('[Auth] Failed to clear current user:', e);
    }
  }

  // --- Check if user is logged in ---
  function isLoggedIn() {
    return getCurrentUser() !== null;
  }

  // --- Register new user ---
  function register(name, email, password) {
    var users = loadUsers();

    // Check if email already exists
    for (var i = 0; i < users.length; i++) {
      if (users[i].email.toLowerCase() === email.toLowerCase()) {
        return { success: false, error: 'Email sudah terdaftar' };
      }
    }

    // Generate new user ID
    var maxId = 0;
    for (var j = 0; j < users.length; j++) {
      if (users[j].id > maxId) maxId = users[j].id;
    }

    // Generate avatar initial
    var avatar = name.trim().charAt(0).toUpperCase();

    var newUser = {
      id: maxId + 1,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: 'user',
      avatar: avatar,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    return { success: true, user: newUser };
  }

  // --- Login user ---
  function login(email, password) {
    var users = loadUsers();

    for (var i = 0; i < users.length; i++) {
      var user = users[i];
      if (user.email.toLowerCase() === email.toLowerCase() && user.password === password) {
        setCurrentUser(user);
        return { success: true, user: user };
      }
    }

    return { success: false, error: 'Email atau kata sandi salah' };
  }

  // --- Logout user ---
  function logout() {
    clearCurrentUser();
    return { success: true };
  }

  // --- Update user profile ---
  function updateProfile(userId, data) {
    var users = loadUsers();
    var currentUser = getCurrentUser();

    for (var i = 0; i < users.length; i++) {
      if (users[i].id === userId) {
        // Update allowed fields
        if (data.name) {
          users[i].name = data.name.trim();
          users[i].avatar = data.name.trim().charAt(0).toUpperCase();
        }
        if (data.email) {
          // Check if new email already exists (exclude current user)
          for (var j = 0; j < users.length; j++) {
            if (j !== i && users[j].email.toLowerCase() === data.email.toLowerCase()) {
              return { success: false, error: 'Email sudah digunakan' };
            }
          }
          users[i].email = data.email.toLowerCase().trim();
        }

        saveUsers(users);

        // Update current session if updating own profile
        if (currentUser && currentUser.id === userId) {
          setCurrentUser(users[i]);
        }

        return { success: true, user: users[i] };
      }
    }

    return { success: false, error: 'User tidak ditemukan' };
  }

  // --- Change password ---
  function changePassword(userId, oldPassword, newPassword) {
    var users = loadUsers();

    for (var i = 0; i < users.length; i++) {
      if (users[i].id === userId) {
        if (users[i].password !== oldPassword) {
          return { success: false, error: 'Kata sandi lama salah' };
        }

        users[i].password = newPassword;
        saveUsers(users);

        return { success: true };
      }
    }

    return { success: false, error: 'User tidak ditemukan' };
  }

  // --- Require authentication (redirect if not logged in) ---
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  // --- Redirect if already logged in ---
  function redirectIfLoggedIn() {
    if (isLoggedIn()) {
      window.location.href = 'dashboard.html';
      return true;
    }
    return false;
  }

  // --- Get user initials for avatar ---
  function getInitials(name) {
    if (!name) return '?';
    var parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // --- Public API ---
  return {
    register: register,
    login: login,
    logout: logout,
    getCurrentUser: getCurrentUser,
    isLoggedIn: isLoggedIn,
    updateProfile: updateProfile,
    changePassword: changePassword,
    requireAuth: requireAuth,
    redirectIfLoggedIn: redirectIfLoggedIn,
    getInitials: getInitials
  };
})();
