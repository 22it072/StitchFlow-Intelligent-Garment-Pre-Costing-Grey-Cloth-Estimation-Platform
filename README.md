# 🧵 StitchFlow  
**Intelligent Garment Pre-Costing & Grey Cloth Estimation Platform**

StitchFlow is a MERN-based web application developed for the textile and garment industry to perform accurate grey cloth weight and cost estimation. The system follows strict function-based calculation rules, ensures secure data storage, and provides a modern SaaS-style user interface.

---

## 🎯 Objective

- Automate grey cloth weight and cost estimation  
- Reduce manual calculation errors  
- Apply textile-industry formatting rules  
- Enable reusable yarn management  
- Maintain complete estimation history  

---

## 🧱 Technology Stack

- Frontend: React.js  
- Backend: Node.js, Express.js  
- Database: MongoDB  
- Authentication: JWT  
- Architecture: REST APIs, Modular Design  

---

## 🎨 Key Features

- Secure user registration and login  
- Modern SaaS-style dashboard  
- Responsive UI (mobile & desktop)  
- Real-time calculation updates  
- Sidebar navigation  
- Professional textile-industry design  

---

## 📊 Dashboard

Displays:
- Total estimates  
- Total grey cloth weight  
- Average cost  
- Recent estimate history  

Quick actions:
- Add new estimate  
- Add yarn  

---

## 🧵 Yarn Management

Users can manage reusable yarns with:
- Yarn name  
- Denier  
- Yarn price  
- GST %  
- Yarn type (Warp / Weft / Weft-2)  

Yarn details are automatically used during estimation.

---

## 📐 Grey Cloth Estimation

Each estimate is saved using a **Quality Name**.

### Inputs
- Warp (Tar, Denier, Wastage %)  
- Weft (Peek, Panna, Denier, Wastage %)  
- Optional Weft-2  

---

## 💰 Cost Calculation

- Cost calculated using formatted weights  
- GST applied from yarn data  
- Other cost per meter added at final stage  
- Cost formatting keeps 2 decimal places  

---

## 💾 Estimate History

Stores:
- Quality name  
- All inputs  
- Calculated weights and costs  
- Final total cost  
- Date and time  

Provides detailed calculation breakdown.

---

## 🗄 Database Collections

- Users  
- Yarns  
- Estimates  
- Calculation History  

---

## 🚀 Conclusion

StitchFlow provides an accurate, reliable, and industry-oriented solution for garment pre-costing and grey cloth estimation. The system improves accuracy, reduces manual effort, and offers a scalable foundation for real-world textile applications.

---
