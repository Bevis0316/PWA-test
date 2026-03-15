let records = [];
let favorites = [];
let savingsTotal = 0; // 存款總額
let currentViewDate = new Date();
let selectedDateString = null;

// DOM 元素
const monthDisplay = document.getElementById('month-display');
const calendarDays = document.getElementById('calendar-days');
const recordList = document.getElementById('record-list');
const favListEl = document.getElementById('fav-list');
const selectedDateLabel = document.getElementById('selected-date-label');
const viewTitle = document.getElementById('view-title');
const savingsEl = document.getElementById('current-savings');

// --- 1. 本地端資料存取 (替換原本的伺服器通訊) ---

// 載入資料
function loadFromLocal() {
    try {
        // 從 localStorage 讀取資料，若無則給予預設值 (空陣列或 0)
        records = JSON.parse(localStorage.getItem('finance_records')) || [];
        savingsTotal = JSON.parse(localStorage.getItem('finance_savings')) || 0;
        
        // 常用項目給予預設值，避免第一次打開時空空的
        const defaultFavs = ["早餐", "午餐", "晚餐", "交通", "飲料"];
        favorites = JSON.parse(localStorage.getItem('finance_favorites')) || defaultFavs;

        renderCalendar();
        renderFavorites();
        updateSavingsUI();
        viewFullMonth(); 
    } catch (e) { 
        console.error("本地載入失敗", e); 
    }
}

// 儲存帳目與存款
function saveAll() {
    localStorage.setItem('finance_records', JSON.stringify(records));
    localStorage.setItem('finance_savings', JSON.stringify(savingsTotal));
    updateSavingsUI();
}

// 儲存常用項目
function saveFavoritesToLocal() {
    localStorage.setItem('finance_favorites', JSON.stringify(favorites));
}
// --- 2. 核心邏輯：新增帳目 (含存款連動) ---
async function addRecordLogic(desc, amt, type) {
    if (!selectedDateString) {
        alert("請先在月曆上選擇一個日期！");
        return;
    }

    const newRec = {
        id: Date.now().toString(),
        date: selectedDateString,
        desc: desc,
        amt: amt,
        type: type
    };

    // 存款連動
    if (type === 'income') savingsTotal += amt;
    else savingsTotal -= amt;

    records.push(newRec);
    await saveAll();
    renderCalendar();
    renderList();
}

// --- 3. 常用項目功能 ---

// 渲染常用列表並綁定事件
function renderFavorites() {
    favListEl.innerHTML = '';
    favorites.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'fav-item';
        li.innerHTML = `
            <span style="flex-grow:1">${item}</span>
            <span class="del-fav">✕</span>
        `;
        
        // 點選項目名稱 -> 快速記帳
        li.onclick = () => quickRecord(item);
        
        // 點選 X -> 刪除常用
        li.querySelector('.del-fav').onclick = (e) => {
            e.stopPropagation();
            deleteFavorite(index);
        };
        
        favListEl.appendChild(li);
    });
}

// 快速記帳彈窗
async function quickRecord(itemName) {
    if (!selectedDateString) return alert("請先點選日期！");
    
    const amount = prompt(`[${selectedDateString}] ${itemName}\n請輸入金額:`, "");
    if (amount === null || amount.trim() === "") return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return alert("請輸入數字！");

    await addRecordLogic(itemName, numAmount, 'expense');
}

window.addFavorite = async function() {
    const input = document.getElementById('new-fav-name');
    const name = input.value.trim();
    if (name && !favorites.includes(name)) {
        favorites.push(name);
        renderFavorites();
        await saveFavoritesToLocal();
        input.value = '';
    }
};

async function deleteFavorite(index) {
    if (confirm("要移除此常用項目嗎？")) {
        favorites.splice(index, 1);
        renderFavorites();
        await saveFavoritesToLocal();
    }
}

// --- 4. 月曆與渲染邏輯 ---
function renderCalendar() {
    calendarDays.innerHTML = '';
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    monthDisplay.innerText = `${year}年 ${month + 1}月`;

    ['日','一','二','三','四','五','六'].forEach(d => {
        const div = document.createElement('div');
        div.className = 'day-name'; div.innerText = d;
        calendarDays.appendChild(div);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) calendarDays.appendChild(document.createElement('div'));

    for (let d = 1; d <= lastDate; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        if (dateStr === todayStr) dayDiv.classList.add('today');
        if (dateStr === selectedDateString) dayDiv.classList.add('selected');
        if (records.some(r => r.date === dateStr)) dayDiv.classList.add('has-data');
        dayDiv.innerText = d;
        dayDiv.onclick = () => selectDate(dateStr);
        calendarDays.appendChild(dayDiv);
    }
}

window.changeMonth = function(step) {
    currentViewDate.setMonth(currentViewDate.getMonth() + step);
    selectedDateString = null;
    renderCalendar();
    viewFullMonth();
};

function selectDate(date) {
    selectedDateString = date;
    viewTitle.innerText = `${date} 紀錄`;
    selectedDateLabel.innerText = `正在記錄：${date}`;
    renderCalendar();
    renderList();
}

window.viewFullMonth = function() {
    selectedDateString = null;
    const year = currentViewDate.getFullYear();
    const month = String(currentViewDate.getMonth() + 1).padStart(2, '0');
    viewTitle.innerText = `${year}年${month}月 整月紀錄`;
    selectedDateLabel.innerText = "請點選日期進行記帳";
    renderCalendar();
    renderList();
};

function renderList() {
    recordList.innerHTML = '';
    let filtered = [];
    
    // 獲取標籤元素
    const incomeLabel = document.getElementById('income-label');
    const expenseLabel = document.getElementById('expense-label');

    // 判斷當前是「單日」還是「整月」視角
    if (selectedDateString) {
        // --- 單日視角 ---
        filtered = records.filter(r => r.date === selectedDateString);
        incomeLabel.innerText = "當日收入"; // 動態修改文字
        expenseLabel.innerText = "當日支出";
    } else {
        // --- 整月視角 ---
        const prefix = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}`;
        filtered = records.filter(r => r.date.startsWith(prefix));
        incomeLabel.innerText = "本月收入"; // 動態修改文字
        expenseLabel.innerText = "本月支出";
    }

    // 計算與渲染邏輯保持不變...
    let inc = 0, exp = 0;
    filtered.forEach((r) => {
        if (r.type === 'income') inc += r.amt; else exp += r.amt;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${r.desc}</td>
            <td class="${r.type}">${r.type==='income'?'+':'-'}$${r.amt.toLocaleString()}</td>
            <td><button onclick="deleteRecord('${r.id}')" style="color:var(--danger); background:none; border:none; cursor:pointer;">✕</button></td>
        `;
        recordList.appendChild(row);
    });

    document.getElementById('total-income').innerText = `$${inc.toLocaleString()}`;
    document.getElementById('total-expense').innerText = `$${exp.toLocaleString()}`;
}

window.deleteRecord = async (id) => {
    if (confirm("⚠️ 確定要刪除嗎？存款也會回退。")) {
        const target = records.find(r => r.id === id);
        if (target) {
            if (target.type === 'income') savingsTotal -= target.amt;
            else savingsTotal += target.amt;
        }
        records = records.filter(r => r.id !== id);
        await saveAll();
        renderCalendar();
        renderList();
    }
};

document.getElementById('finance-form').onsubmit = async (e) => {
    e.preventDefault();
    const desc = document.getElementById('desc').value;
    const amt = parseFloat(document.getElementById('amt').value);
    const type = document.getElementById('type').value;
    await addRecordLogic(desc, amt, type);
    e.target.reset();
};

loadFromServer();