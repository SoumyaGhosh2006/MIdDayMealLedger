# Product Scope Document: Midday Meal Ledger Tool

## 1. Project Identity & Objective
**Name:** Midday Meal Ledger
**Objective:** To completely eliminate the manual, error-prone process of writing daily school meal expenses and student attendance into physical paper ledgers. This assistant tool allows the user to speak the daily data naturally, automatically formatting and storing it in a permanent digital ledger that can be exported on demand.

## 2. Target Audience & The Problem
**User:** A school principal in India managing daily school operations.
**The Problem:** At the end of every school day, the user must manually calculate and write down the cost of various grocery items (egg, oil, dal, vegetables) and the attendance of students across multiple classes (Class V to VIII). This is monotonous, time-consuming, and makes end-of-month reporting a massive chore of manual addition.

## 3. The Core Solution
A mobile-friendly assistant tool that operates through a simple voice interface. The tool listens to the daily summary, extracts the relevant numbers and categories, and securely saves them. It acts as a continuous digital ledger.

## 4. The User Journey & System Flow
The tool operates in two distinct modes: **Daily Entry Mode** and **Reporting Mode**.

### Phase A: Daily Entry Mode (Data Ingestion)
1. **The Interface:** The user opens the tool on their mobile browser. The interface is distraction-free, featuring a prominent "Record" button.
2. **The Voice Input:** The user taps the button and speaks naturally (e.g., "Today is July 2nd. Menu is Mixveg, Soya, and Dal. We spent 90 rupees on eggs, 220 on oil... Class V had 31 students, Class VI had 48...").
3. **The Transcription:** The tool captures this raw audio and converts it perfectly into text.
4. **The Intelligence:** The tool reads the transcribed text and intelligently maps the spoken numbers to the correct ledger columns, even if the user speaks them out of order.
5. **The Storage:** Instead of forcing the user to download a file immediately, the tool quietly saves this extracted data as a new entry in a secure, continuous database.
6. **The Confirmation:** The user sees a clean table on their screen confirming what was saved for that day, allowing them to review it quickly.

### Phase B: Reporting Mode (Data Export)
1. **The Request:** At the end of the week, month, or any arbitrary time, the user needs the actual Excel sheet for official records.
2. **The Date Selection:** The user selects a date range (e.g., "Generate report up to July 31st").
3. **The Compilation:** The tool retrieves all the saved daily entries up to that specific date.
4. **The Export:** The tool dynamically generates a perfectly formatted `.xlsx` (Excel) file containing all the rows, with a final "Total" row calculated at the bottom, and triggers a download to the user's device.

## 5. Strict Data Schema
The tool must accurately extract and store the following columns to match the physical ledger exactly:
* **Identifier:** DATE
* **Expenses:** Egg, Oil, Dal, Soya/Potato, Masala, Grocery, Veg, Fuel
* **Calculated Expenses:** Total
* **Inventory:** OB of Rice, Daily Count, C.B of Rice
* **Attendance:** V, VI, VII, VIII
* **Calculated Attendance:** VI-VIII Total, Total
* **Text:** Menu