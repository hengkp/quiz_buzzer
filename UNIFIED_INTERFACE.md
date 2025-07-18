# Among Us Unified Interface

## 🎯 **Perfect Solution for Dual-Screen Setup**

The new system provides a main display and a separate console window that work together seamlessly. This is perfect for your dual-screen setup with no overlay clutter!

## 🚀 **How to Use**

### 1. Start the Server
```bash
cd web
python dev_server.py --host 0.0.0.0 --port 8080
```

### 2. Open the Interface
- **Main Display**: `http://localhost:8080/`
- The beautiful main display shows immediately
- Click **"🎮 Open Console Window"** button (top-right) to open controls

### 3. Dual-Screen Setup
1. **Open main display** at `http://localhost:8080/` on your MacBook
2. **Drag the main window** to your projector screen
3. **Press F11** or **⌘+Shift+F** to make it fullscreen on projector
4. **Return to MacBook** and click **"🎮 Open Console Window"**
5. **Separate console window** opens on MacBook for controls
6. **Both windows sync** in real-time automatically

## ✨ **New Features**

### **Clean Console Design**
- **Collapsible Sections**: Click section headers to expand/collapse
- **Hidden Details**: Color pickers appear only when "Change Color" is clicked
- **Quick Actions**: Most-used controls at the top for fast access
- **Organized Layout**: Teams, Timer, Questions, Arduino all in separate sections

### **Smart Interface**
- **Real-time Sync**: Console changes instantly update main display
- **Separate Windows**: Console runs in its own window, main display stays clean
- **Always Visible**: Both windows stay open and visible simultaneously
- **Professional Logs**: Live action logging with timestamps

### **Quick Actions Bar**
- ⏰ **Start Timer** - One-click timer start/pause
- 🔔 **Clear Buzzers** - Reset all buzzer states
- 🔄 **Reset Game** - Complete game reset (with confirmation)
- ⚡ **Toggle 2x** - Enable/disable challenge mode

## 🎨 **Console Sections**

### **1. Arduino Connection** (Collapsible)
- Connection status indicator
- Port selection dropdown
- Connect/disconnect controls

### **2. Timer Control** (Expanded by default)
- Large timer display
- Set custom duration
- Start/pause/stop/reset controls

### **3. Question Sets** (Collapsible)
- Subject selection (Biology, Chemistry, Physics, General)
- Question set dropdown (1-8)
- Custom question titles

### **4. Team Management** (Expanded by default)
- 6 teams in clean grid layout
- Score controls (+1, -1, Reset)
- Hidden color pickers (click "Change Color" to reveal)
- Real-time score sync

## 🖥️ **Dual-Screen Workflow**

### **Setup Phase**
1. Open `http://localhost:8080/` on MacBook
2. Drag main window to projector screen
3. Make fullscreen on projector (F11)
4. Return to MacBook
5. Click "🎮 Open Console Window" - opens on MacBook

### **During Competition**
1. **Main display** shows on projector (beautiful, clean interface)
2. **Console window** stays on MacBook (all controls accessible)
3. **Real-time updates** sync between both windows
4. **Logs panel** tracks all actions with timestamps

### **Easy Management**
- Teams can see scores and progress on projector
- You control everything from MacBook console window
- Both windows always visible and synced
- Console window can be resized/moved as needed

## 🎮 **Controls Summary**

| Action | How to Do It |
|--------|-------------|
| **Start Timer** | Quick action button or Timer section |
| **Change Score** | Team cards: +1, -1, Reset buttons |
| **Change Team Color** | Click "Change Color" → Pick from color grid |
| **Clear Buzzers** | Quick action button |
| **Select Subject** | Question Sets section → Click subject |
| **View Logs** | Right panel shows all actions |
| **Reset Everything** | Quick action "Reset Game" button |

## 🎯 **Benefits of Separate Windows**

✅ **Two Windows** - Main display + separate console window  
✅ **Real-time Sync** - Instant updates across both windows  
✅ **Clean Design** - Hidden details until needed  
✅ **Dual-Screen Ready** - Perfect for projector + laptop setup  
✅ **Professional Look** - Clean, organized, Apple-style interface  
✅ **Always Visible** - Both windows stay open simultaneously  
✅ **Complete Logging** - Full audit trail of all actions  

## 🔧 **Technical Notes**

- **Main Display**: `web/among_us.html` 
- **Console Window**: `web/console.html`
- **Legacy Support**: Old `/among_us_main` and `/among_us_console` still work
- **Real-time**: Uses Socket.IO for instant synchronization between windows
- **Responsive**: Both windows adapt to different screen sizes
- **Window Management**: Console opens in separate browser window

Perfect for your **รอบชิงชนะเลิศ การแข่งขันตอบปัญหาทางวิทยาศาสตร์** competition! 🏆👨‍🚀 