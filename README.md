# বিধায়ক সেবা কেন্দ্র (Bidhayak Seva Kendra - BSK)
### গোগঘাট বিধানসভা কেন্দ্র (Goghat Assembly Constituency - AC 201), হুগলী জেলা

An official, professional, full-stack civic portal built specifically for the citizens of **Goghat Assembly Constituency (গোগঘাট বিধানসভা কেন্দ্র - AC 201)** to directly connect with their Member of Legislative Assembly (MLA / বিধায়ক).

---

## 🏛️ Goghat Assembly Constituency Information
- **Assembly Segment**: AC 201 - Goghat (গোগঘাট)
- **District**: Hooghly (হুগলী)
- **Subdivision**: Arambagh (আরামবাগ)
- **Blocks Covered**: Goghat I & Goghat II Blocks
- **Major Gram Panchayats**: Kamarpukur, Goghat I & II, Badanganj-Faluigram, Bali, Nakunda, Bengai, Raghubati, Saora, Shyambazar, Mandaran, Bhursut.
- **Constituency Helpline**: `03211-255014`
- **Main Kendra Address**: Kamarpukur - Goghat Link Road, Hooghly - 712614

---

## 🔒 Professional Privacy Model & Citizen Access
1. **Zero Public Leakage**:
   - The public homepage shows **no aggregate statistics or internal tallies** (such as pending, approved, rejected, delete counts).
   - Citizens do not see other citizens' grievance records or private information.
2. **Citizen Isolation (Strictly His/Her Own Data)**:
   - Citizens register & authenticate using their **10-Digit Mobile Number and One-Time Password (OTP)**.
   - Once logged in, citizens have access to **"আমার অভিযোগসমূহ (My Tickets)"** which strictly displays only their own submitted grievances, current statuses, and official MLA responses.
   - When filing a new grievance, their registered profile (Name, Phone, GP, Address) is automatically pre-filled.

---

## 🛡️ Bidhayak (MLA) Executive Admin Portal
A simplified, executive, clean, and modern administration portal designed for the Hon'ble MLA and the Seva Kendra administrative desk:
- **Clean Summary KPI Cards**: Total Tickets, Pending Review, In Progress, Approved, and Rejected.
- **Search & Filter**: Search by ticket ID, citizen name, phone, Gram Panchayat, or problem keyword.
- **Simple 3 Action Buttons on every ticket**:
  - 🔵 **ইন প্রগ্রেস (In Progress)**: Issue inspection orders or route to BDO / PWD / PHE / WBSEDCL.
  - 🟢 **অনুমোদন (Approve)**: Grant work order approval or sanction funds with official sanction remarks.
  - 🔴 **বাতিল (Reject)**: Formally reject ineligible applications with a mandatory official explanation.
  - 🔍 **বিস্তারিত (View Details)**: Open the full citizen dossier and requested relief.
- **Export**: 1-click export of grievances to a CSV report.

---

## 🔑 Administrative Access

- **Portal URL**: `http://localhost:3000`
- **Admin Email**: `mla@seva.gov.in`
- **Admin Password**: `admin123`
*(A 1-click demo button is provided on the admin login page for instant access)*

---

## 🚀 How to Run Locally

```bash
# Start backend and frontend concurrently:
npm run dev

# Or start individually:
cd backend && npm run dev    # Backend API on http://localhost:5000
cd frontend && npm run dev   # Frontend Portal on http://localhost:3000
```
