let uploadedFiles = [];
let currentUser = null;

// Initialize
(async function init() {
    const session = await checkSession();
    if(session) {
        currentUser = session.user;
        document.getElementById('userEmail').innerText = `Logged in as: ${currentUser.email}`;
        loadHistory();
    }
})();

// Handle File Selection
document.getElementById('fileInput').addEventListener('change', (e) => {
    const files = e.target.files;
    const list = document.getElementById('fileList');
    list.innerHTML = '';
    uploadedFiles = [];

    Array.from(files).forEach((file, index) => {
        const div = document.createElement('div');
        div.className = 'file-card';
        div.innerHTML = `
            <strong>📄 ${file.name}</strong>
            <input type="number" id="pages-${index}" min="1" placeholder="Enter total pages" onchange="generateSelectors(${index})">
            
            <div id="color-box-${index}" class="checkbox-group"></div>
            
            <div class="binding-row">
                <input type="checkbox" id="binding-${index}">
                <label for="binding-${index}">Add Spiral Binding (+₹20)</label>
            </div>
        `;
        list.appendChild(div);
        uploadedFiles.push({ file, colorPages: [], totalPages: 0 });
    });
});

function generateSelectors(index) {
    const total = parseInt(document.getElementById(`pages-${index}`).value);
    const box = document.getElementById(`color-box-${index}`);
    box.innerHTML = '<p style="margin:5px 0; font-size:0.9em;">Select Color Pages (others are B&W):</p>';
    uploadedFiles[index].totalPages = total;

    for(let i=1; i<=total; i++) {
        const span = document.createElement('label');
        span.className = 'checkbox-item';
        span.innerHTML = `<input type="checkbox" value="${i}" onchange="updateColor(${index}, this)"> Pg ${i}`;
        box.appendChild(span);
    }
}

function updateColor(idx, cb) {
    if(cb.checked) uploadedFiles[idx].colorPages.push(cb.value);
    else uploadedFiles[idx].colorPages = uploadedFiles[idx].colorPages.filter(x => x !== cb.value);
}

function calculateTotal() {
    let grandTotal = 0;
    let copies = document.getElementById('copies').value;
    let breakdown = "<ul>";
    
    // Validation
    if(uploadedFiles.length === 0) return alert("Please upload at least one file.");
    if(!document.getElementById('deadlineDate').value) return alert("Please select a date.");

    uploadedFiles.forEach((doc, idx) => {
        let isBinding = document.getElementById(`binding-${idx}`).checked;
        let colorCost = doc.colorPages.length * 10;
        let bwCost = (doc.totalPages - doc.colorPages.length) * 2;
        if(bwCost < 0) bwCost = 0; // Prevention
        let bindCost = isBinding ? 20 : 0;
        let docCost = colorCost + bwCost + bindCost;
        
        grandTotal += docCost;
        breakdown += `<li><strong>${doc.file.name}</strong>: ₹${docCost} (Binding: ${isBinding?'Yes':'No'})</li>`;
    });

    grandTotal *= copies;
    window.currentTotal = grandTotal;

    document.getElementById('summarySection').classList.remove('hidden');
    document.getElementById('costBreakdown').innerHTML = breakdown + `</ul>`;
    document.getElementById('totalPrice').innerText = `Total: ₹${grandTotal}`;
}

async function placeOrder() {
    try {
        const deadlineDate = document.getElementById('deadlineDate').value;
        if (!deadlineDate) return alert("Please select a deadline date.");

        // 1. Create the Order in the database
        const { data: orderData, error: orderError } = await supabaseClient
            .from('orders')
            .insert([{
                user_id: currentUser.id,
                student_email: currentUser.email,
                deadline_date: deadlineDate,
                deadline_time: document.getElementById('deadlineTime').value,
                copies: document.getElementById('copies').value,
                total_cost: window.currentTotal
            }])
            .select();

        if (orderError) throw orderError;
        const newOrderId = orderData[0].id;

        // 2. Loop through files and upload
        for (let i = 0; i < uploadedFiles.length; i++) {
            const doc = uploadedFiles[i];
            
            // Generate a clean, unique filename
            const cleanName = doc.file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const uniquePath = `${Date.now()}_${cleanName}`;

            console.log("Attempting upload to bucket 'documents' with path:", uniquePath);

            // UPLOAD ATTEMPT
            const { error: uploadError } = await supabaseClient.storage
                .from('documents')
                .upload(uniquePath, doc.file);

            if (uploadError) {
                console.error("Storage Error Details:", uploadError);
                throw new Error(`Storage Failed: ${uploadError.message}`);
            }

            // GET PUBLIC URL
            const { data: { publicUrl } } = supabaseClient.storage
                .from('documents')
                .getPublicUrl(uniquePath);

            // 3. Link file to the Order in the database
            const { error: itemError } = await supabaseClient.from('order_items').insert([{
                order_id: newOrderId,
                file_name: doc.file.name,
                file_url: publicUrl,
                total_pages: doc.totalPages,
                color_pages: doc.colorPages.join(','),
                binding: document.getElementById(`binding-${i}`).checked
            }]);

            if (itemError) throw itemError;
        }

        alert("🎉 Order successfully placed and file uploaded!");
        location.reload();

    } catch (err) {
        console.error("FULL ERROR LOG:", err);
        alert("❌ Error: " + err.message);
    }
}
async function loadHistory() {
    const { data } = await supabaseClient.from('orders')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    const div = document.getElementById('orderHistory');
    div.innerHTML = '';
    if(data.length === 0) div.innerHTML = "<p>No orders yet.</p>";

    data.forEach(o => {
        div.innerHTML += `
            <div class="file-card">
                <strong>Order #${o.id}</strong> <br>
                Status: <span style="color:${o.status==='Ready'?'green':'orange'}">${o.status}</span> <br>
                Cost: ₹${o.total_cost} | Deadline: ${o.deadline_date}
            </div>`;
    });
}