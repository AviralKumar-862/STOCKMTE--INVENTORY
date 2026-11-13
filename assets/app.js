/* StockMate - client-side inventory management demo.
   Data is stored in the browser's localStorage. No server/database is used. */
(() => {
  const KEY = "stockmate_data_v1";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const today = new Date().toISOString().slice(0,10);
  const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n)||0);
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const uid = prefix => prefix + "-" + Math.random().toString(36).slice(2,8).toUpperCase();
  const seed = {
    categories:["Footwear","Accessories","Apparel","Electronics"],
    suppliers:[
      {id:"SUP-1001",name:"Apex Traders",phone:"9876543210",email:"apex@example.com",address:"Kanpur, Uttar Pradesh"},
      {id:"SUP-1002",name:"Metro Wholesale",phone:"9123456780",email:"metro@example.com",address:"Lucknow, Uttar Pradesh"},
      {id:"SUP-1003",name:"Prime Distributors",phone:"9988776655",email:"prime@example.com",address:"Unnao, Uttar Pradesh"}
    ],
    products:[
      {id:"PRD-1001",name:"Classic Sports Shoes",category:"Footwear",sku:"SH-001",price:1299,cost:780,quantity:42,minStock:15,supplier:"SUP-1001"},
      {id:"PRD-1002",name:"Leather Formal Shoes",category:"Footwear",sku:"SH-002",price:1899,cost:1150,quantity:9,minStock:12,supplier:"SUP-1002"},
      {id:"PRD-1003",name:"Canvas Sneakers",category:"Footwear",sku:"SH-003",price:999,cost:560,quantity:68,minStock:20,supplier:"SUP-1001"},
      {id:"PRD-1004",name:"Travel Backpack",category:"Accessories",sku:"AC-001",price:1499,cost:850,quantity:6,minStock:10,supplier:"SUP-1003"},
      {id:"PRD-1005",name:"Cotton T-Shirt",category:"Apparel",sku:"AP-001",price:499,cost:210,quantity:125,minStock:30,supplier:"SUP-1002"},
      {id:"PRD-1006",name:"Wireless Mouse",category:"Electronics",sku:"EL-001",price:699,cost:390,quantity:0,minStock:8,supplier:"SUP-1003"}
    ],
    transactions:[
      {id:"TXN-1001",type:"IN",productId:"PRD-1001",quantity:42,unitPrice:780,date:today,party:"Apex Traders",note:"Opening stock"},
      {id:"TXN-1002",type:"IN",productId:"PRD-1002",quantity:9,unitPrice:1150,date:today,party:"Metro Wholesale",note:"Opening stock"},
      {id:"TXN-1003",type:"OUT",productId:"PRD-1003",quantity:12,unitPrice:999,date:today,party:"Walk-in customer",note:"Counter sale"}
    ]
  };
  let db = load();
  let currentPage = "dashboard";
  let modalHandler = null;

  function load(){
    try { const raw=localStorage.getItem(KEY); if(raw){const d=JSON.parse(raw); if(d.products&&d.transactions&&d.suppliers&&d.categories)return d;} } catch(e){}
    localStorage.setItem(KEY,JSON.stringify(seed)); return structuredCloneSafe(seed);
  }
  function structuredCloneSafe(o){return JSON.parse(JSON.stringify(o));}
  function save(){localStorage.setItem(KEY,JSON.stringify(db));}
  function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove("show"),2600);}
  function product(id){return db.products.find(p=>p.id===id);}
  function supplier(id){return db.suppliers.find(s=>s.id===id);}
  function status(p){return p.quantity===0?"Out of stock":p.quantity<=p.minStock?"Low stock":"In stock";}
  function statusBadge(p){const s=status(p);return `<span class="badge ${s==="In stock"?"badge-green":s==="Low stock"?"badge-amber":"badge-red"}">${s}</span>`;}
  function pageHeader(title,desc,action,label){return `<div class="section-heading"><div><h2>${title}</h2><p>${desc}</p></div>${action?`<button class="primary-btn" id="${action}">＋ ${label}</button>`:""}</div>`;}
  function tableShell(title,tools,content){return `<div class="table-card"><div class="table-toolbar"><h3 class="table-title">${title}</h3><div class="toolbar-actions">${tools||""}</div></div><div class="table-wrap">${content}</div></div>`;}
  function emptyRow(cols,msg){return `<tr><td colspan="${cols}"><div class="empty">${msg}</div></td></tr>`;}
  function render(){
    const titles={dashboard:"Dashboard",products:"Products",categories:"Categories",suppliers:"Suppliers",transactions:"Stock transactions",reports:"Reports"};
    $("#pageTitle").textContent=titles[currentPage]; $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===currentPage));
    const fn={dashboard:dashboardPage,products:productsPage,categories:categoriesPage,suppliers:suppliersPage,transactions:transactionsPage,reports:reportsPage};
    $("#pageContent").innerHTML=fn[currentPage]();
    bindPageEvents();
  }
  function dashboardPage(){
    const total=db.products.length, qty=db.products.reduce((a,p)=>a+p.quantity,0), low=db.products.filter(p=>p.quantity<=p.minStock&&p.quantity>0).length, out=db.products.filter(p=>p.quantity===0).length;
    const value=db.products.reduce((a,p)=>a+p.quantity*p.cost,0);
    const recent=[...db.transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
    const lowItems=db.products.filter(p=>p.quantity<=p.minStock).sort((a,b)=>a.quantity-b.quantity).slice(0,5);
    const monthLabels=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthly=Array(6).fill(0); const labels=[];
    for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);labels.push(monthLabels[d.getMonth()]);}
    db.transactions.forEach(t=>{const diff=(new Date().getMonth()-new Date(t.date).getMonth()+12)%12;if(diff<6&&new Date(t.date).getFullYear()===new Date().getFullYear())monthly[5-diff]+=t.type==="IN"?t.quantity:-t.quantity;});
    const max=Math.max(1,...monthly.map(Math.abs));
    return `<div class="welcome-row"><div><h2>Good ${new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}, Admin 👋</h2><p>Here's what's happening with your inventory today.</p></div><span class="inline-note">Live overview · Browser data</span></div>
      <div class="stats-grid">
        ${stat("Total products",total,"▤","icon-blue","Across all categories")}
        ${stat("Units in stock",qty.toLocaleString("en-IN"),"▣","icon-green","Available inventory units")}
        ${stat("Low stock items",low,"⚑","icon-amber",`${out} products out of stock`)}
        ${stat("Inventory value",money(value),"₹","icon-red","Based on purchase cost")}
      </div>
      <div class="dashboard-grid">
        <div class="panel"><div class="panel-head"><div><h3>Stock movement</h3><p>Net unit movement · Last 6 months</p></div><div class="legend"><span><i style="background:#4169e1"></i>Net units</span></div></div><div class="bar-chart">${monthly.map((v,i)=>`<div class="bar-col"><span class="bar-value">${v>0?"+":""}${v}</span><div class="bar" style="height:${Math.max(3,Math.abs(v)/max*72)}%"></div><span class="bar-label">${labels[i]}</span></div>`).join("")}</div></div>
        <div class="panel"><div class="panel-head"><div><h3>Needs attention</h3><p>Products at or below minimum level</p></div><button class="subtle-link" data-goto="products">View all</button></div><div class="stock-list">${lowItems.length?lowItems.map(p=>`<div class="stock-row"><div><div class="stock-name">${esc(p.name)}</div><div class="stock-meta">${esc(p.sku)} · Minimum ${p.minStock}</div></div><div class="stock-count">${p.quantity} left</div><div class="progress"><span style="width:${Math.min(100,p.minStock? p.quantity/p.minStock*100:0)}%"></span></div></div>`).join(""):`<div class="empty">All products are above minimum stock.</div>`}</div></div>
      </div>
      ${tableShell("Recent transactions",`<button class="subtle-link" data-goto="transactions">View all transactions →</button>`,transactionTable(recent))}
    `;
  }
  function stat(label,value,icon,cls,foot){return `<div class="stat-card"><div class="stat-top">${label}<span class="stat-icon ${cls}">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></div>`;}
  function transactionTable(items){return `<table><thead><tr><th>Transaction</th><th>Product</th><th>Type</th><th>Quantity</th><th>Date</th><th>Party</th></tr></thead><tbody>${items.length?items.map(t=>{const p=product(t.productId);return `<tr><td><strong>${esc(t.id)}</strong></td><td>${esc(p?.name||"Deleted product")}</td><td><span class="transaction-type ${t.type==="IN"?"type-in":"type-out"}">${t.type==="IN"?"Stock in":"Stock out"}</span></td><td>${t.quantity}</td><td>${esc(t.date)}</td><td>${esc(t.party||"—")}</td></tr>`}).join(""):emptyRow(6,"No transactions recorded yet.")}</tbody></table>`;}
  function productsPage(){
    return `${pageHeader("Product catalogue","Manage products, prices and stock thresholds.","addProduct","Add product")}
    ${tableShell("All products",`<input class="search-input" id="productSearch" placeholder="Search name or SKU…"><select class="filter-select" id="productFilter"><option value="">All stock status</option><option>In stock</option><option>Low stock</option><option>Out of stock</option></select>`,productTable(db.products))}`;
  }
  function productTable(items){return `<table id="productsTable"><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Available</th><th>Unit cost</th><th>Selling price</th><th>Status</th><th>Actions</th></tr></thead><tbody>${items.length?items.map(p=>`<tr><td><div class="product-cell"><span class="product-thumb">▤</span><div><strong>${esc(p.name)}</strong><div class="stock-meta">${esc(p.id)}</div></div></div></td><td>${esc(p.sku)}</td><td>${esc(p.category)}</td><td><strong>${p.quantity}</strong> units</td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td>${statusBadge(p)}</td><td><button class="action-btn" data-edit-product="${p.id}" title="Edit">✎</button><button class="action-btn" data-delete-product="${p.id}" title="Delete">⌫</button></td></tr>`).join(""):emptyRow(8,"No products found.")}</tbody></table>`;}
  function categoriesPage(){
    return `${pageHeader("Categories","Organise your catalogue into product groups.","addCategory","Add category")}<div class="category-grid">${db.categories.map(c=>`<div class="category-card"><div class="product-thumb">▧</div><strong>${esc(c)}</strong><p>${db.products.filter(p=>p.category===c).length} products in this category</p><div style="margin-top:12px"><button class="action-btn" data-delete-category="${esc(c)}">Remove category</button></div></div>`).join("")||`<div class="empty">No categories yet.</div>`}</div>`;
  }
  function suppliersPage(){
    const rows=db.suppliers.map(s=>`<tr><td><strong>${esc(s.name)}</strong><div class="stock-meta">${esc(s.id)}</div></td><td>${esc(s.phone)}</td><td>${esc(s.email||"—")}</td><td>${esc(s.address||"—")}</td><td>${db.products.filter(p=>p.supplier===s.id).length}</td><td><button class="action-btn" data-edit-supplier="${s.id}">✎</button><button class="action-btn" data-delete-supplier="${s.id}">⌫</button></td></tr>`).join("");
    return `${pageHeader("Suppliers","Keep supplier contact information in one place.","addSupplier","Add supplier")}${tableShell("Supplier directory","",`<table><thead><tr><th>Supplier</th><th>Phone</th><th>Email</th><th>Address</th><th>Products</th><th>Actions</th></tr></thead><tbody>${rows||emptyRow(6,"No suppliers added yet.")}</tbody></table>`)}`;
  }
  function transactionsPage(){
    const items=[...db.transactions].sort((a,b)=>b.date.localeCompare(a.date));
    return `${pageHeader("Stock transactions","Track every stock receipt and issue.","addTransaction","New transaction")}${tableShell("Transaction history",`<input class="search-input" id="txnSearch" placeholder="Search transaction or product…"><select class="filter-select" id="txnFilter"><option value="">All types</option><option value="IN">Stock in</option><option value="OUT">Stock out</option></select>`,transactionFullTable(items))}`;
  }
  function transactionFullTable(items){return `<table id="txnTable"><thead><tr><th>Transaction ID</th><th>Date</th><th>Product</th><th>Type</th><th>Quantity</th><th>Unit price</th><th>Party / Reference</th><th>Notes</th></tr></thead><tbody>${items.length?items.map(t=>`<tr><td><strong>${esc(t.id)}</strong></td><td>${esc(t.date)}</td><td>${esc(product(t.productId)?.name||"Deleted product")}</td><td><span class="transaction-type ${t.type==="IN"?"type-in":"type-out"}">${t.type==="IN"?"Stock in":"Stock out"}</span></td><td>${t.quantity}</td><td>${money(t.unitPrice)}</td><td>${esc(t.party||"—")}</td><td>${esc(t.note||"—")}</td></tr>`).join(""):emptyRow(8,"No transactions recorded.")}</tbody></table>`;}
  function reportsPage(){
    const ins=db.transactions.filter(t=>t.type==="IN"),outs=db.transactions.filter(t=>t.type==="OUT");
    const totalIn=ins.reduce((a,t)=>a+t.quantity,0),totalOut=outs.reduce((a,t)=>a+t.quantity,0);
    return `${pageHeader("Inventory reports","Review stock position and download your data.","exportAll","Export all data")}
      <div class="report-cards"><div class="report-card"><small>Total units received</small><strong>${totalIn.toLocaleString("en-IN")}</strong></div><div class="report-card"><small>Total units issued</small><strong>${totalOut.toLocaleString("en-IN")}</strong></div><div class="report-card"><small>Current stock value</small><strong>${money(db.products.reduce((a,p)=>a+p.quantity*p.cost,0))}</strong></div></div>
      ${tableShell("Current stock report",`<button class="secondary-btn" id="exportProducts">Download CSV</button>`,`<table><thead><tr><th>Product</th><th>Category</th><th>Quantity</th><th>Minimum level</th><th>Unit cost</th><th>Stock value</th><th>Status</th></tr></thead><tbody>${db.products.map(p=>`<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.category)}</td><td>${p.quantity}</td><td>${p.minStock}</td><td>${money(p.cost)}</td><td>${money(p.quantity*p.cost)}</td><td>${statusBadge(p)}</td></tr>`).join("")||emptyRow(7,"No product data.")}</tbody></table>`)}
      <div style="margin-top:14px" class="panel"><div class="panel-head"><div><h3>Export options</h3><p>Download CSV files that open in Microsoft Excel or Google Sheets.</p></div></div><div class="toolbar-actions"><button class="secondary-btn" id="exportTransactions">Export transactions</button><button class="secondary-btn" id="exportSuppliers">Export suppliers</button><button class="secondary-btn" id="backupData">Download JSON backup</button><label class="secondary-btn" for="restoreFile">Restore JSON backup</label><input type="file" id="restoreFile" accept=".json,application/json" hidden></div></div>`;
  }
  function bindPageEvents(){
    $("#addProduct")?.addEventListener("click",()=>productModal());
    $("#addCategory")?.addEventListener("click",()=>categoryModal());
    $("#addSupplier")?.addEventListener("click",()=>supplierModal());
    $("#addTransaction")?.addEventListener("click",()=>transactionModal());
    $$("[data-goto]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.goto)));
    $$("[data-edit-product]").forEach(b=>b.addEventListener("click",()=>productModal(b.dataset.editProduct)));
    $$("[data-delete-product]").forEach(b=>b.addEventListener("click",()=>deleteProduct(b.dataset.deleteProduct)));
    $$("[data-edit-supplier]").forEach(b=>b.addEventListener("click",()=>supplierModal(b.dataset.editSupplier)));
    $$("[data-delete-supplier]").forEach(b=>b.addEventListener("click",()=>deleteSupplier(b.dataset.deleteSupplier)));
    $$("[data-delete-category]").forEach(b=>b.addEventListener("click",()=>deleteCategory(b.dataset.deleteCategory)));
    $("#productSearch")?.addEventListener("input",filterProducts); $("#productFilter")?.addEventListener("change",filterProducts);
    $("#txnSearch")?.addEventListener("input",filterTransactions); $("#txnFilter")?.addEventListener("change",filterTransactions);
    $("#exportAll")?.addEventListener("click",exportAll); $("#exportProducts")?.addEventListener("click",exportProducts);
    $("#exportTransactions")?.addEventListener("click",exportTransactions); $("#exportSuppliers")?.addEventListener("click",exportSuppliers);
    $("#backupData")?.addEventListener("click",backupData); $("#restoreFile")?.addEventListener("change",restoreData);
  }
  function navigate(page){currentPage=page;render();$("#sidebar").classList.remove("open");}
  function filterProducts(){const q=$("#productSearch").value.toLowerCase(),f=$("#productFilter").value;const list=db.products.filter(p=>(p.name.toLowerCase().includes(q)||p.sku.toLowerCase().includes(q))&&(!f||status(p)===f));$("#productsTable tbody").innerHTML=list.length?productTable(list).match(/<tbody>([\s\S]*)<\/tbody>/)[1]:emptyRow(8,"No matching products.");bindProductActions();}
  function bindProductActions(){$$("[data-edit-product]").forEach(b=>b.addEventListener("click",()=>productModal(b.dataset.editProduct)));$$("[data-delete-product]").forEach(b=>b.addEventListener("click",()=>deleteProduct(b.dataset.deleteProduct)));}
  function filterTransactions(){const q=$("#txnSearch").value.toLowerCase(),f=$("#txnFilter").value;const list=[...db.transactions].filter(t=>(!f||t.type===f)&&(`${t.id} ${product(t.productId)?.name||""} ${t.party||""}`.toLowerCase().includes(q))).sort((a,b)=>b.date.localeCompare(a.date));$("#txnTable tbody").innerHTML=list.length?transactionFullTable(list).match(/<tbody>([\s\S]*)<\/tbody>/)[1]:emptyRow(8,"No matching transactions.");}
  function showModal(title,fields,onSubmit,eyebrow="STOCKMATE"){ $("#modalTitle").textContent=title;$("#modalEyebrow").textContent=eyebrow;$("#modalFields").innerHTML=fields;$("#modalBackdrop").classList.add("show");modalHandler=onSubmit; }
  function closeModal(){$("#modalBackdrop").classList.remove("show");$("#modalForm").reset();modalHandler=null;}
  function field(name,label,type="text",value="",opts="",full=false,required=true){let input=type==="select"?`<select name="${name}" ${required?"required":""}>${opts}</select>`:type==="textarea"?`<textarea name="${name}" placeholder="${label}" ${required?"required":""}>${esc(value)}</textarea>`:`<input name="${name}" type="${type}" value="${esc(value)}" placeholder="${label}" ${required?"required":""} ${type==="number"?'min="0" step="any"':""}>`;return `<div class="field ${full?"full":""}"><label>${label}${required?" *":""}</label>${input}</div>`;}
  function productModal(id){const p=id?product(id):{};const categoryOpts=db.categories.map(c=>`<option ${p.category===c?"selected":""}>${esc(c)}</option>`).join("");const supplierOpts=`<option value="">No supplier selected</option>`+db.suppliers.map(s=>`<option value="${s.id}" ${p.supplier===s.id?"selected":""}>${esc(s.name)}</option>`).join("");
    showModal(id?"Edit product":"Add new product",field("name","Product name","text",p.name||"")+field("sku","SKU / Product code","text",p.sku||"")+field("category","Category","select","","<option value=''>Select category</option>"+categoryOpts)+field("quantity","Opening quantity","number",p.quantity??0)+field("cost","Purchase cost (₹)","number",p.cost??0)+field("price","Selling price (₹)","number",p.price??0)+field("minStock","Minimum stock level","number",p.minStock??5)+field("supplier","Supplier","select","",""+supplierOpts),data=>{data.quantity=Number(data.quantity);data.cost=Number(data.cost);data.price=Number(data.price);data.minStock=Number(data.minStock);if(!Number.isInteger(data.quantity)||data.quantity<0||data.cost<0||data.price<0||!Number.isInteger(data.minStock)||data.minStock<0)return toast("Enter valid non-negative quantities and prices.");if(id){Object.assign(p,data);}else{db.products.push({id:uid("PRD"),...data});}save();closeModal();render();toast(id?"Product updated":"Product added successfully");});
  }
  function categoryModal(){showModal("Add category",field("name","Category name"),d=>{const n=d.name.trim();if(db.categories.some(c=>c.toLowerCase()===n.toLowerCase()))return toast("Category already exists");db.categories.push(n);save();closeModal();render();toast("Category added");});}
  function supplierModal(id){const s=id?supplier(id):{};showModal(id?"Edit supplier":"Add supplier",field("name","Supplier name","text",s.name||"")+field("phone","Phone number","tel",s.phone||"")+field("email","Email address","email",s.email||"", "",false,false)+field("address","Address","text",s.address||"","",true,false),d=>{if(id)Object.assign(s,d);else db.suppliers.push({id:uid("SUP"),...d});save();closeModal();render();toast(id?"Supplier updated":"Supplier added");});}
  function transactionModal(){if(!db.products.length)return toast("Add a product before recording stock.");const productOpts=db.products.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.quantity} available</option>`).join("");
    showModal("Record stock transaction",field("type","Transaction type","select","","<option value='IN'>Stock in (receive)</option><option value='OUT'>Stock out (issue / sale)</option>")+field("productId","Product","select","",productOpts)+field("quantity","Quantity","number","1")+field("unitPrice","Unit price (₹)","number","0")+field("date","Transaction date","date",today)+field("party","Supplier / Customer","text","", "",false,false)+field("note","Notes","textarea","", "",true,false),d=>{
      const p=product(d.productId),qty=Number(d.quantity);
      if(!p||!Number.isInteger(qty)||qty<=0)return toast("Enter a valid whole-number quantity.");
      if(d.type==="OUT"&&qty>p.quantity)return toast(`Insufficient stock. Only ${p.quantity} units available.`);
      p.quantity += d.type==="IN"?qty:-qty;
      db.transactions.push({id:uid("TXN"),...d,quantity:qty,unitPrice:Number(d.unitPrice),party:d.party||"",note:d.note||""});
      save();closeModal();render();toast(d.type==="IN"?"Stock received and quantity updated":"Stock issued and quantity updated");
    });
  }
  function deleteProduct(id){const p=product(id);if(!p)return;if(!confirm(`Delete "${p.name}"? Existing transaction history will remain.`))return;db.products=db.products.filter(x=>x.id!==id);save();render();toast("Product deleted");}
  function deleteSupplier(id){if(db.products.some(p=>p.supplier===id))return toast("This supplier is linked to products. Update those products first.");if(!confirm("Delete this supplier?"))return;db.suppliers=db.suppliers.filter(s=>s.id!==id);save();render();toast("Supplier deleted");}
  function deleteCategory(c){if(db.products.some(p=>p.category===c))return toast("Category is in use. Reassign its products first.");if(!confirm(`Remove category "${c}"?`))return;db.categories=db.categories.filter(x=>x!==c);save();render();toast("Category removed");}
  function csvDownload(name,rows){const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});downloadBlob(name,blob);}
  function downloadBlob(name,blob){const a=document.createElement("a"),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
  function exportProducts(){csvDownload("stockmate-products.csv",[["Product ID","Name","SKU","Category","Quantity","Minimum Stock","Purchase Cost","Selling Price","Status"],...db.products.map(p=>[p.id,p.name,p.sku,p.category,p.quantity,p.minStock,p.cost,p.price,status(p)])]);}
  function exportTransactions(){csvDownload("stockmate-transactions.csv",[["Transaction ID","Date","Type","Product","Quantity","Unit Price","Party","Notes"],...db.transactions.map(t=>[t.id,t.date,t.type,product(t.productId)?.name||"",t.quantity,t.unitPrice,t.party,t.note])]);}
  function exportSuppliers(){csvDownload("stockmate-suppliers.csv",[["Supplier ID","Name","Phone","Email","Address"],...db.suppliers.map(s=>[s.id,s.name,s.phone,s.email,s.address])]);}
  function exportAll(){exportProducts();setTimeout(exportTransactions,250);setTimeout(exportSuppliers,500);toast("Export files are being downloaded");}
  function backupData(){downloadBlob("stockmate-backup.json",new Blob([JSON.stringify(db,null,2)],{type:"application/json"}));toast("Backup downloaded");}
  function restoreData(e){const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const d=JSON.parse(reader.result);if(!Array.isArray(d.products)||!Array.isArray(d.transactions)||!Array.isArray(d.suppliers)||!Array.isArray(d.categories))throw Error();if(!confirm("Replace current StockMate data with this backup?"))return;db=d;save();render();toast("Backup restored successfully");}catch(err){toast("Invalid StockMate backup file");}};reader.readAsText(file);e.target.value="";}
  $("#modalForm").addEventListener("submit",e=>{e.preventDefault();if(!modalHandler)return;const data=Object.fromEntries(new FormData(e.currentTarget).entries());modalHandler(data);});
  $("#closeModal").addEventListener("click",closeModal);$("#cancelModal").addEventListener("click",closeModal);$("#modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal();});
  $$(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.page)));
  $("#quickStockIn").addEventListener("click",()=>{navigate("transactions");transactionModal();});
  $("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  $("#todayDate").textContent=new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric"}).format(new Date());$("#year").textContent=new Date().getFullYear();
  render();
})();