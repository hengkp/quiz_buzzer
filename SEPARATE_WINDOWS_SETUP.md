# Among Us Quiz Bowl - Separate Windows Setup

## ✅ **Perfect Dual-Screen Solution**

You now have **two separate windows** that work together seamlessly:
- **Main Display Window** - Beautiful display for projector
- **Console Window** - Clean controls for MacBook

Both windows sync in real-time and stay visible simultaneously!

## 🚀 **Setup Instructions**

### **Step 1: Start Server**
```bash
cd web
python dev_server.py --host 0.0.0.0 --port 8080
```

### **Step 2: Open Main Display**
- Go to: `http://localhost:8080/`
- Beautiful Among Us main display appears
- Shows team scores, timer, progress, animations

### **Step 3: Open Console Window**
- Click **"🎮 Open Console Window"** (top-right button)
- Separate console window opens automatically
- Console has all controls organized in clean sections

### **Step 4: Dual-Screen Setup**
1. **Drag main display window** to projector screen
2. **Press F11** to make it fullscreen on projector
3. **Console window stays** on MacBook for your control
4. **Both windows sync** in real-time

## 🎯 **How It Works**

### **Main Display Window** (for projector)
- ✅ Beautiful Thai competition title
- ✅ Progress bar with moving Among Us character
- ✅ Timer display
- ✅ 6 team cards with scores and animations
- ✅ Sound effects and visual feedback
- ✅ No controls - stays clean for audience

### **Console Window** (for MacBook)
- ✅ Quick action buttons (Start Timer, Clear Buzzers, etc.)
- ✅ Collapsible sections (Arduino, Timer, Teams, Questions)
- ✅ Team management with hidden color pickers
- ✅ Real-time action logs
- ✅ All controls organized and easy to use

## 🔄 **Real-Time Synchronization**

Both windows are connected via Socket.IO:
- Change team score in console → **Instantly updates** on main display
- Team buzzes in → **Shows on both** console logs and main display
- Timer starts/stops → **Syncs across** both windows
- All actions logged → **Live updates** in console

## 📱 **Window Management**

### **Main Display Window**
- Can be moved to projector screen
- Can be made fullscreen (F11)
- Clean interface with no controls
- Only shows "🎮 Open Console Window" button

### **Console Window**
- Opens in separate browser window
- Can be resized and positioned
- Has "Close Window" button
- Contains all game controls

## 🎮 **Console Features**

### **Quick Actions** (always visible)
- ⏰ **Start Timer** - One-click timer start
- 🔔 **Clear Buzzers** - Reset all buzzer states  
- 🔄 **Reset Game** - Complete game reset
- ⚡ **Toggle 2x** - Enable/disable challenge mode

### **Organized Sections** (collapsible)
1. **🔌 Arduino Connection** - Port selection, connect/disconnect
2. **⏱️ Timer Control** - Set duration, start/pause/stop/reset
3. **📚 Question Sets** - Subject selection, question set management
4. **👥 Team Management** - Score controls, color changes (hidden until clicked)

### **Live Logs Panel**
- Real-time action logging with timestamps
- Export logs functionality
- Clear logs option
- Professional terminal-style display

## 🏆 **Competition Workflow**

### **Before Competition**
1. Start server
2. Open main display (`http://localhost:8080/`)
3. Drag to projector, make fullscreen
4. Click "🎮 Open Console Window" on MacBook
5. Test all controls and connections

### **During Competition**
1. **Teams see** beautiful display on projector
2. **You control** everything from console window on MacBook
3. **All changes** sync instantly between windows
4. **Action logs** track every event with timestamps

### **After Competition**
1. Export logs from console window
2. Close console window
3. Main display can stay open for final scores

## 🎯 **Benefits**

✅ **Always Visible** - Both windows stay open simultaneously  
✅ **Clean Separation** - Display for audience, controls for operator  
✅ **Real-time Sync** - Instant updates across both windows  
✅ **Professional Setup** - Perfect for competition environment  
✅ **Easy Management** - All controls organized and accessible  
✅ **No Interference** - Console doesn't block main display  

## 🔧 **Files**

- **Main Display**: `web/among_us.html`
- **Console**: `web/console.html`  
- **Server**: `web/dev_server.py`
- **URLs**:
  - Main: `http://localhost:8080/`
  - Console: `http://localhost:8080/console` (opens automatically)

Perfect for your **รอบชิงชนะเลิศ การแข่งขันตอบปัญหาทางวิทยาศาสตร์** competition! 🏆👨‍🚀

No more overlay clutter - just clean, separate windows that work perfectly together! 