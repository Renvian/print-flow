let allOrders = [];

async function loadOrders() {
    // Fetching from Supabase using your specific client name
    const { data } = await supabaseClient.from('orders')
        .select(`*, order_items(*)`)
        .eq('status', 'Pending')
        .order('deadline_date', { ascending: true });
        
    allOrders = data;
    render(allOrders);
}

function render(orders) {
    const div = document.getElementById('adminOrders');
    div.innerHTML = '';
    
    if(orders.length === 0) {
        div.innerHTML = "<p>No pending orders.</p>";
        return;
    }

    orders.forEach(o => {
        let items = o.order_items.map(i => `
            <div style="margin:5px 0; background:#fff; padding:8px; border:1px solid #ddd;">
                <a href="${i.file_url}" target="_blank" style="font-weight:bold; color:#007bff;">⬇️ ${i.file_name}</a><br>
                <small>Pages: ${i.total_pages} | Color: [${i.color_pages || 'None'}] | Binding: ${i.binding ? "✅ Yes" : "❌ No"}</small>
            </div>
        `).join('');

        div.innerHTML += `
            <div class="file-card" style="border-left:5px solid #007bff">
                <h3>Order #${o.id}</h3>
                <p><strong>Student:</strong> ${o.student_email}</p>
                <p><strong>Deadline:</strong> ${o.deadline_date} at ${o.deadline_time}</p>
                <p><strong>Copies:</strong> ${o.copies} | <strong>Total:</strong> ₹${o.total_cost}</p>
                <div style="margin:10px 0;">${items}</div>
                <button onclick="markReady(${o.id})">✅ Mark as Ready</button>
            </div>
        `;
    });
}

async function markReady(id) {
    if(confirm("Are you sure this order is printed?")) {
        await supabaseClient.from('orders').update({status:'Ready'}).eq('id', id);
        loadOrders();
    }
}

// ---------------- GEMINI AI LOGIC ---------------- //
async function sortGemini() {
    if (allOrders.length === 0) return alert("No orders to sort.");
    
    const btn = document.querySelector('button[onclick="sortGemini()"]');
    btn.innerText = "🤖 AI Thinking...";
    btn.disabled = true;

    // 1. Prepare Data
    const orderListLite = allOrders.map(o => ({
        id: o.id,
        files: o.order_items.map(i => i.file_name).join(", "),
        deadline: o.deadline_date
    }));

    // 2. Prompt
    const promptText = `
    You are a print shop manager. Sort these orders by urgency.
    Rules:
    1. Deadline date is priority #1.
    2. If deadlines are close, prioritize "Resumes/CVs" > "Reports" > "Notes".
    Input JSON: ${JSON.stringify(orderListLite)}
    
    Return ONLY a JSON array of IDs in sorted order (e.g., [5, 2, 1]). No markdown.
    `;

    // 3. API Call
    try {
       
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        
        // Clean and Parse
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const sortedIds = JSON.parse(cleanJson);

        // Sort Local Data
        const sortedOrders = [];
        sortedIds.forEach(id => {
            const order = allOrders.find(o => o.id === id);
            if(order) sortedOrders.push(order);
        });

        // Add remaining (if Gemini missed any)
        allOrders.forEach(o => {
            if(!sortedOrders.includes(o)) sortedOrders.push(o);
        });

        render(sortedOrders);
        alert("✅ Sorted by AI Priority!");

    } catch (err) {
        console.error(err);
        alert("Enter Gemini API key from Google Ai studio, using the model gemini-2.0-flash");
    } finally {
        btn.innerText = "✨ Sort Priority with Gemini AI";
        btn.disabled = false;
    }
}

// Load on start

loadOrders();
