# Print flow 🖨️✨
 
**Tech Stack:** HTML5, CSS3, JavaScript (ES6+), Supabase, Google Gemini 2.0 Flash AI.

---

## 1. Idea & Problem Statement

### The Problem:
College print shops face massive bottlenecks, especially during placement seasons and exam weeks. 
- Time Inefficiency: Students stand in long queues just to hand over files via USB or WhatsApp.
- Manual Calculation: Operators manually count B&W vs. Color pages, leading to pricing errors and slow service.
- Queue Chaos: A 100-page generic manual and a 1-page urgent Resume are treated with the same priority, which is inefficient for students with immediate deadlines.

### The Solution:
A Smart Print Portal that digitizes the workflow. Students upload documents and set configurations remotely. The system then uses Artificial Intelligence to act as a "Virtual Manager," automatically prioritizing the print queue so that critical documents like Resumes and Placement forms are handled first.

---

## 2. Technology Stack & Tools

- HTML5: Multi-page dashboard with Auth, Student, and Admin views.
- CSS3: Custom styling, responsive layouts, and clean professional UI.
- JavaScript (Vanilla ES6+): Handles page-count calculations, dynamic cost estimation, async API calls to AI and Database, and real-time DOM updates.
- Supabase: PostgreSQL Database management, User Authentication, and Cloud File Storage.
- Google Gemini 2.0 Flash: AI model used to intelligently prioritize print orders based on filenames, content type, and deadlines.

---

## 3. Frontend API Key Management

All API keys for Supabase and Gemini are stored in a single file called `config.js`. This file contains all the keys needed for the application to run. The keys are not published for obvious security concerns

---

## 4. Effectiveness & Impact (Student Perspective)

- Zero Waiting Time: Students submit orders remotely from classrooms or the library.
- Instant Cost Clarity: The integrated calculator provides the exact price immediately upon upload.
- Status Tracking: Students only visit the shop when order status is "Ready."
- Flexible Pay-at-Pickup: Payment occurs after collection, supporting both UPI/QR and cash.

---

## 5. How It Works (Project Flow)

### Student Journey:
1. Authentication via Supabase Auth.
2. Upload PDF/Docs, specify copies, and select color pages.
3. Files are stored in Supabase Storage, and metadata is saved in the PostgreSQL database.

### Admin Journey (AI-Powered):
1. Dashboard shows live "Pending" orders.
2. Gemini 2.0 Flash AI analyzes filenames and deadlines to create a Priority Queue, ensuring urgent documents are printed first.
3. Admin marks orders as "Ready," instantly updating student dashboards.

---

## 6. Security & API Notes

- All API keys are stored in `config.js`.
- Frontend exposure is unavoidable for anon keys, which is acceptable for hackathon/demo purposes.
- For professional production-grade deployment:
  - Move API calls to a backend proxy.
  - Use environment variables and secret management.
  - Restrict API keys by domain and quota.

---

## 7.Database Schema (Supabase)

### 1. `Entries`
| Column | Type | Key |
| :--- | :--- | :--- |
| `user_id` | `uuid` | PK |
| `date` | `timestamp` | |
| `content` | `text` | |
| `mood` | `text` | |

### 2. `orders`
| Column | Type | Key |
| :--- | :--- | :--- |
| `id` | `int8` | PK |
| `user_id` | `uuid` | |
| `student_email` | `text` | |
| `deadline_date` | `date` | |
| `deadline_time` | `time` | |
| `copies` | `int4` | |
| `total_cost` | `numeric` | |
| `status` | `text` | |
| `created_at` | `timestamptz` | |

### 3. `order_items`
| Column | Type | Key |
| :--- | :--- | :--- |
| `id` | `int8` | PK |
| `order_id` | `int8` | FK (orders.id) |
| `file_name` | `text` | |
| `file_url` | `text` | |
| `total_pages` | `int4` | |
| `color_pages` | `text` | |
| `binding` | `bool` | |
| `binding_cost` | `numeric` | |

---

**Relationships:**
* `order_items.order_id` references `orders.id` (One-to-Many).

---

## 8. How to Run Locally

1. Download or clone the repository.
2. Copy the example key file to `config.js` and fill in your API keys, note that the model in use is gemini-2.0-flash.
3. Open `index.html` in a browser.
4. Admin Login: admin@college.com (Password: 123456)

---

## 9. Notes

- Google Gemini 2.0 Flash is the AI-powered model used to prioritize print orders intelligently.
- `config.js` is the single source of API keys and should be kept private if real credentials are used.
- The project uses Supabase free tier, which is safe for demonstration purposes.
