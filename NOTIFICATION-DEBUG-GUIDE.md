# 🐛 Notification Debug Guide

## Issue Reported:
> "User can see unread count (1) but no notifications appear in the dropdown"

---

## ✅ **What We Fixed**

### **Critical Bug:** `req.user.userId` vs `req.user._id`

**Location:** `backend/src/modules/social/controllers/follow.controller.js`

**Problem:**
- Auth middleware sets `req.user` as full user object with `_id`
- Follow controller was using `req.user.userId` (undefined!)
- This caused `currentUserId` to be `undefined`
- Follow worked, but notification logic failed silently

**Fix Applied:**
Changed ALL instances of `req.user.userId` to `req.user._id` in:
- `followUser()` - Line 11
- `unfollowUser()` - Line 47
- `isFollowing()` - Line 65
- `getMutualFollows()` - Line 137
- `getFollowSuggestions()` - Line 154
- `muteUser()` - Line 230
- `unmuteUser()` - Line 248
- `blockUser()` - Line 266
- `unblockUser()` - Line 284
- `getFollowFeed()` - Line 356
- `getMyFollowStats()` - Line 383
- `getUserProfile()` - Line 336

---

## 🧪 **Test Results**

Ran `backend/test-follow-notifications.js`:

```
✅ Notification template created correctly
✅ Notification sent to Redis
✅ Notification stored in list
✅ Unread count incremented
✅ Notification retrieved successfully
✅ All Redis keys working
```

**Notification Structure:**
```json
{
  "id": "notif_1761071323068_ave2n58r4",
  "type": "user_followed",
  "title": "New Follower",
  "message": "testuser started following you",
  "data": {
    "followerId": "507f1f77bcf86cd799439012",
    "followerUsername": "testuser",
    "followerAvatar": null
  },
  "priority": "medium",
  "read": false,
  "createdAt": "2025-10-21T18:28:43.068Z"
}
```

---

## 🔍 **How to Debug Further**

### **Check 1: Browser Console**

Open browser DevTools → Console tab and look for:
- API call to `/api/v1/social/notifications?limit=10&unreadOnly=false`
- Response data structure
- Any error messages

### **Check 2: Network Tab**

DevTools → Network tab → Filter by "notifications":
1. Click notification bell
2. Look for `GET /api/v1/social/notifications`
3. Check Response:
   ```json
   {
     "success": true,
     "data": {
       "notifications": [...],  // Should have items
       "unreadCount": 1,
       "total": 1
     }
   }
   ```

### **Check 3: Frontend Console Logs**

Add temporary logging to `Notifications.jsx`:

```javascript
const notifications = data?.data?.notifications || [];

// ADD THIS
console.log('[NotificationBell] Data:', data);
console.log('[NotificationBell] Notifications:', notifications);
console.log('[NotificationBell] Unread count:', unreadCount);
```

### **Check 4: Backend Logs**

When you follow a user, backend should log:
```
[INFO] Follow notification sent to user <userId>
```

If you don't see this, the notification isn't being sent.

---

## 🎯 **Expected vs Actual**

### **Expected Flow:**
```
User A follows User B
  ↓
followUser() called with correct IDs
  ↓
Notification created and sent
  ↓
Redis stores notification
  ↓
Socket emits to User B
  ↓
User B's notification count: +1
  ↓
User B clicks bell
  ↓
API fetches notifications
  ↓
Notifications appear in dropdown
```

### **What Was Happening:**
```
User A follows User B
  ↓
followUser() called with currentUserId = undefined ❌
  ↓
Notification NOT sent (silent fail)
  ↓
Unread count somehow incremented (race condition?)
  ↓
User B clicks bell
  ↓
API returns empty notifications array
  ↓
Dropdown shows "No notifications"
```

---

## ✅ **What Should Happen Now**

After the `req.user.userId` → `req.user._id` fix:

1. **Follow a user:**
   - Backend logs: `[INFO] Follow notification sent to user <userId>`
   - Redis stores notification
   - Socket emits event
   - Unread count increments

2. **Click notification bell:**
   - API call to `/api/v1/social/notifications`
   - Returns notifications array with follow notification
   - Dropdown shows "X started following you"
   - Unread count badge shows correct number

3. **Click notification:**
   - Marks as read
   - Navigates to follower's profile
   - Badge count decrements

---

## 🚀 **Next Steps to Test**

1. **Restart Backend:**
   ```bash
   # Stop current backend
   # Restart with: docker-compose restart backend
   # OR: npm run dev (if running locally)
   ```

2. **Clear Browser Cache:**
   - Clear localStorage
   - Hard refresh (Ctrl+Shift+R)
   - Or use incognito window

3. **Test Follow Flow:**
   - User A logs in
   - User A searches for User B
   - User A clicks "Follow"
   - User B refreshes page
   - User B clicks notification bell
   - **Should now see notification!** ✅

---

## 📋 **Files Modified**

1. ✅ `backend/src/modules/social/controllers/follow.controller.js`
   - Fixed all instances of `req.user.userId` → `req.user._id`
   - Added logging for notification sent

2. ✅ `frontend/src/components/Topbar/Sidebar.jsx`
   - Added "Find People" navigation

3. ✅ `frontend/src/components/Topbar/Header.jsx`
   - Added "Find People" to mobile drawer

4. ✅ `frontend/src/api/slices/socialApi.js`
   - Fixed follow/unfollow endpoints
   - Added search and profile endpoints

---

## 🎊 **Expected Result**

After restarting backend, follow notifications should work perfectly:
- ✅ Unread count appears
- ✅ Notifications appear in dropdown
- ✅ Click notification → navigate to user profile
- ✅ Real-time delivery via Socket.io

---

*Test Status: Backend verified ✅, Frontend needs restart*

