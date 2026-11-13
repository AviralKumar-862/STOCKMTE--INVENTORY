# StockMate – Inventory Management System

**BCA 5th Semester Minor Project**  
A responsive, browser-based inventory management application built with HTML, CSS and vanilla JavaScript.

## 1. Project overview

StockMate helps a small shop or business maintain product records, suppliers, stock receipts, stock issues and inventory reports. It replaces basic manual stock-register work with a simple dashboard.

### Main features

- Dashboard with product count, available units, low-stock count and inventory value
- Product management: add, edit, delete, search and filter
- Category management
- Supplier directory
- Stock-in and stock-out transactions
- Automatic quantity update after every transaction
- Prevention of stock-out transactions beyond available quantity
- Low-stock and out-of-stock status indicators
- Transaction history
- CSV exports for products, transactions and suppliers
- JSON backup and restore
- Responsive layout for desktop, tablet and mobile
- Sample data included for demonstration

## 2. Technology stack

| Technology | Usage |
|---|---|
| HTML5 | Application structure |
| CSS3 | Responsive interface and styling |
| JavaScript (Vanilla) | Application logic and interactions |
| Browser LocalStorage | Client-side data persistence |
| Chart-style CSS bars | Stock movement summary |

**Important:** This GitHub Pages edition is a front-end demonstration. It does not use a server, Flask, SQLite or a shared cloud database. Data is saved in the browser's LocalStorage on the device/browser being used. It is not automatically synchronized between different users or devices. Do not use it to store confidential business information.

## 3. Project folder structure

```text
StockMate/
├── index.html
├── README.md
└── assets/
    ├── app.js
    └── style.css
```

## 4. Run locally

1. Download and extract the ZIP file.
2. Open the `StockMate` folder.
3. Double-click `index.html` to open it in a modern browser.
4. The application loads sample inventory data automatically.

No installation, package manager or build command is required.

## 5. Publish using GitHub Pages

1. Sign in to GitHub and create a new **public** repository, for example `stockmate-inventory`.
2. Open the repository and choose **Add file → Upload files**.
3. Upload `index.html`, `README.md` and the complete `assets` folder. Keep the folder structure unchanged.
4. Commit the uploaded files to the `main` branch.
5. Open **Settings → Pages** in the repository.
6. Under **Build and deployment**, select **Deploy from a branch**.
7. Select branch `main` and folder `/ (root)`, then click **Save**.
8. Wait for GitHub Pages to publish. The site URL will appear in the Pages section, usually:
   `https://YOUR-USERNAME.github.io/stockmate-inventory/`

If the page shows 404, confirm that `index.html` is in the repository root, the Pages source is `main` / root, and the deployment has finished.

## 6. How to use StockMate

### Dashboard
The dashboard summarises products, available units, low-stock products and inventory value. It also shows recent transactions and products that need attention.

### Products
Choose **Add product** to enter product name, SKU, category, opening quantity, purchase cost, selling price, minimum stock level and optional supplier. Use the edit and delete icons to maintain the catalogue.

### Categories
Create categories before assigning products. A category cannot be removed while products are assigned to it.

### Suppliers
Add supplier contact details. A supplier linked to a product cannot be deleted until the product is reassigned or removed.

### Stock transactions
Choose **New transaction**:
- **Stock in:** increases available quantity.
- **Stock out:** decreases available quantity.
- The system rejects zero/negative quantities and prevents issuing more than available stock.

### Reports
Download CSV reports that can be opened in Excel or Google Sheets. JSON backup and restore can be used to move data between browser sessions manually.

## 7. Stock calculation

```text
Closing Stock = Opening Stock + Total Stock In - Total Stock Out
```

Example:

```text
Opening stock = 100 units
Stock received = 50 units
Stock issued = 30 units
Closing stock = 100 + 50 - 30 = 120 units
```

Inventory value on the dashboard is calculated using purchase cost:

```text
Inventory Value = Sum of (Available Quantity × Purchase Cost)
```

## 8. Suggested database design for the project report

This static GitHub Pages version stores a JSON data object in LocalStorage rather than relational database tables. For the report, the logical entities are:

- **Users:** user_id, username, password_hash (conceptual; no real authentication in this static demo)
- **Categories:** category_id, category_name
- **Suppliers:** supplier_id, name, phone, email, address
- **Products:** product_id, name, sku, category, quantity, minimum_stock, purchase_cost, selling_price, supplier_id
- **Transactions:** transaction_id, product_id, transaction_type, quantity, unit_price, date, party, notes

A future full-stack edition could implement these entities in SQLite/MySQL with proper user authentication and server-side validation.

## 9. Limitations and future scope

Current limitations:
- No real user authentication or role-based access control
- Data is local to one browser profile and device
- No simultaneous multi-user editing
- No cloud database or server-side backup
- CSV export is provided; PDF invoice generation is not included

Future enhancements:
- Flask/Node.js backend and relational database
- Secure login and multiple user roles
- Cloud synchronisation
- Barcode scanning
- Purchase orders and sales invoices
- Multiple warehouse support
- PDF report generation

## 10. Academic note

Use this project as a learning and demonstration base. Before submitting, customise the title page, student details, institution details, screenshots, diagrams, testing evidence and references according to your college's prescribed project-report format. Understand the source code so you can explain each module during your viva.
