# Frontend-Backend Integration Setup

## 🚀 **Quick Start Guide**

### **1. Backend Setup**
First, make sure your backend is running:

```bash
cd backend
npm install
npm run dev
```

Your backend should be running on `http://localhost:5000`

### **2. Frontend Setup**
Install the required dependencies:

```bash
cd clintrackapp
npm install
```

### **3. Start the Frontend**
```bash
npx expo start
```

## 📱 **Testing the Integration**

### **1. Registration Flow**
1. Open the app
2. Select "Doctor" role
3. Click "Login/Register"
4. Click "Sign Up"
5. Fill in the registration form:
   - Full Name: Dr. John Doe
   - Email: john.doe@example.com
   - Phone Number: 9876543210 (exactly 10 digits)
   - Password: password123
   - PIN Code: 123456
   - Specialty: General Medicine
6. Click "Create Account"
7. You should see a success message and be redirected to the dashboard

### **2. Login Flow**
1. From the signup screen, click "Already have an account? Login"
2. Enter your email and password
3. Click "Login"
4. You should be redirected to the dashboard

### **3. Profile Management**
1. From the dashboard, click the profile icon (top right)
2. Click "Edit Profile"
3. Update your information
4. Click "Save Changes"
5. You should see updated information

### **4. Dashboard Data**
The dashboard will show:
- Your name from the backend
- Statistics from the backend (if available)
- Real-time data from your profile

## 🔧 **API Endpoints Used**

### **Authentication**
- `POST /api/auth/register` - Doctor registration
- `POST /api/auth/login` - Doctor login
- `POST /api/auth/logout` - Doctor logout
- `GET /api/auth/me` - Get current doctor
- `PUT /api/auth/change-password` - Change password

### **Profile Management**
- `GET /api/doctor/profile` - Get doctor profile
- `PUT /api/doctor/profile` - Update doctor profile

### **Dashboard**
- `GET /api/doctor/dashboard` - Get dashboard data
- `GET /api/doctor/statistics` - Get statistics

## 🐛 **Troubleshooting**

### **Common Issues**

1. **"Network Error" or "Failed to fetch"**
   - Make sure your backend is running on `http://localhost:5000`
   - Check if your phone/emulator can access localhost
   - For physical devices, use your computer's IP address instead of localhost

2. **"Invalid credentials" during login**
   - Make sure you're using the correct email and password
   - Check if the user was created successfully during registration

3. **"Token expired" or "Unauthorized"**
   - The token might have expired
   - Try logging out and logging in again

4. **Profile not loading**
   - Check if you're logged in
   - Verify the token is being sent with requests

### **For Physical Device Testing**

If you're testing on a physical device, update the API URL:

1. Find your computer's IP address:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`

2. Update `clintrackapp/config/api.js`:
   ```javascript
   development: {
     baseURL: 'http://YOUR_IP_ADDRESS:5000/api',
   },
   ```

3. Make sure your backend allows connections from your device's IP

## 📝 **Next Steps**

1. **File Upload**: Implement ID document upload functionality
2. **Patient Management**: Connect patient screens to backend
3. **Session Management**: Add session tracking
4. **Real-time Updates**: Add push notifications
5. **Offline Support**: Add offline data caching

## 🔒 **Security Notes**

- Tokens are stored securely using AsyncStorage
- All API requests include proper authentication headers
- Password changes require current password verification
- All sensitive data is handled securely

## 📞 **Support**

If you encounter any issues:
1. Check the console logs for error messages
2. Verify your backend is running and accessible
3. Check the network tab in your browser's developer tools
4. Ensure all required fields are filled correctly
