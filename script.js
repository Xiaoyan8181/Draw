document.addEventListener('DOMContentLoaded', () => {
    let items = [];
    let winners = [];
    let currentWeightOffset = 0.5;
    let lastRotation = 0;
    
    // Load saved items and settings from localStorage
    function loadSavedData() {
        const savedItems = localStorage.getItem('lotteryItems');
        if (savedItems) {
            items = JSON.parse(savedItems);
            items.forEach(item => item.originalWeight = item.originalWeight || item.weight);
        }
        const savedNoRepeat = localStorage.getItem('noRepeat');
        const savedFinitePool = localStorage.getItem('finitePool');
        if (savedNoRepeat) {
            document.getElementById('noRepeat').checked = JSON.parse(savedNoRepeat);
        }
        if (savedFinitePool) {
            document.getElementById('finitePool').checked = JSON.parse(savedFinitePool);
        }
        updateItemList();
        updateWheel();
    }

    // Save items and settings to localStorage
    function saveData() {
        localStorage.setItem('lotteryItems', JSON.stringify(items));
        localStorage.setItem('noRepeat', JSON.stringify(document.getElementById('noRepeat').checked));
        localStorage.setItem('finitePool', JSON.stringify(document.getElementById('finitePool').checked));
    }

    loadSavedData();

    const addItemBtn = document.getElementById('addItemBtn');
    addItemBtn.addEventListener('click', () => {
        document.getElementById('addItemModal').style.display = 'flex';
        document.getElementById('itemName').focus();
    });

    const cancelAdd = document.getElementById('cancelAdd');
    cancelAdd.addEventListener('click', () => {
        document.getElementById('addItemModal').style.display = 'none';
        document.getElementById('itemName').value = '';
        document.getElementById('itemWeight').value = '';
    });

    const confirmAdd = document.getElementById('confirmAdd');
    confirmAdd.addEventListener('click', () => {
        const name = document.getElementById('itemName').value.trim();
        const weight = parseInt(document.getElementById('itemWeight').value);
        if (name && weight > 0) {
            items.push({ name, weight, originalWeight: weight });
            updateItemList();
            updateWheel();
            saveData();
            document.getElementById('addItemModal').style.display = 'none';
            document.getElementById('itemName').value = '';
            document.getElementById('itemWeight').value = '';
        } else {
            alert('請輸入有效名稱和比重');
        }
    });

    const clearAllItems = document.getElementById('clearAllItems');
    clearAllItems.addEventListener('click', () => {
        items = [];
        winners = [];
        updateItemList();
        updateWinnerList();
        updateWheel();
        saveData();
    });

    const startDraw = document.getElementById('startDraw');
    startDraw.addEventListener('click', () => {
        if (items.length === 0) {
            alert('請先新增項目');
            return;
        }

        const noRepeat = document.getElementById('noRepeat').checked;
        const finitePool = document.getElementById('finitePool').checked;
        const availableItems = items.filter(item => item.weight > 0);

        if (availableItems.length === 0) {
            alert('無可用項目');
            return;
        }

        const wheel = document.querySelector('.wheel');
        wheel.style.transition = 'none';

        const totalWeight = availableItems.reduce((sum, item) => sum + item.weight, 0);
        const randomValue = Math.random() * totalWeight;

        const drawOffset = (currentWeightOffset + randomValue) % totalWeight;
        const correctedOffset = drawOffset;

        let winner = null;
        let weightCursor = 0;
        for (const item of availableItems) {
            const weightEnd = weightCursor + item.weight;
            if (correctedOffset >= weightCursor && correctedOffset < weightEnd) {
                winner = item;
                break;
            }
            weightCursor = weightEnd;
        }

        const winnerCenterWeight = weightCursor + (winner.weight / 2);
        const targetAngle = (winnerCenterWeight / totalWeight) * 360;
        const currentAngle = (currentWeightOffset / totalWeight) * 360;
        const spins = 10 * 360;
        const finalAngle = spins + targetAngle;

        lastRotation = finalAngle % 360;

        requestAnimationFrame(() => {
            wheel.style.transition = 'transform 6s cubic-bezier(0.1, 0.9, 0.2, 1)';
            wheel.style.transform = `rotate(${finalAngle}deg)`;
        });

        currentWeightOffset = (currentWeightOffset + randomValue) % totalWeight;

        setTimeout(() => {
            wheel.style.transition = 'none';
            wheel.style.transform = `rotate(${lastRotation}deg)`;

            winners.push(winner.name);
            updateWinnerList();

            if (noRepeat) {
                winner.weight = 0;
            } else if (finitePool) {
                winner.weight = Math.max(0, winner.weight - 1);
            }

            updateItemList();
            updateWheel();
            saveData();
        }, 6000);
    });

    const clearWinners = document.getElementById('clearWinners');
    clearWinners.addEventListener('click', () => {
        winners = [];
        updateWinnerList();
        items.forEach(item => item.weight = item.originalWeight);
        updateItemList();
        updateWheel();
        saveData();
        currentWeightOffset = 0.5;
        lastRotation = (currentWeightOffset / items.reduce((sum, item) => sum + item.weight, 0)) * 360;
        const wheel = document.querySelector('.wheel');
        wheel.style.transition = 'none';
        wheel.style.transform = `rotate(${lastRotation}deg)`;
    });

    const noRepeatCheckbox = document.getElementById('noRepeat');
    const finitePoolCheckbox = document.getElementById('finitePool');
    noRepeatCheckbox.addEventListener('change', () => {
        if (noRepeatCheckbox.checked) finitePoolCheckbox.checked = false;
        saveData();
    });
    finitePoolCheckbox.addEventListener('change', () => {
        if (finitePoolCheckbox.checked) noRepeatCheckbox.checked = false;
        saveData();
    });

    function updateItemList() {
        const itemList = document.getElementById('itemList');
        itemList.innerHTML = '<h2>獎池項目</h2>';
        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'item-entry';
            if (item.color) {
                div.style.backgroundColor = item.color;
            }
            const nameSpan = document.createElement('span');
            nameSpan.textContent = `${item.name} (比重: ${item.weight})`;
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', () => {
                items.splice(index, 1);
                updateItemList();
                updateWheel();
                saveData();
            });
            div.appendChild(nameSpan);
            div.appendChild(deleteBtn);
            itemList.appendChild(div);
        });
    }

    function updateWinnerList() {
        const winnersUl = document.getElementById('winners');
        winnersUl.innerHTML = '';
        winners.forEach(winner => {
            const li = document.createElement('li');
            li.textContent = winner;
            winnersUl.appendChild(li);
        });
    }

    function updateWheel() {
        const wheel = document.querySelector('.wheel');
        wheel.innerHTML = '';
        if (items.length === 0) return;

        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let currentAngle = -90;
        const centerX = 200;
        const centerY = 200;
        const radius = 180;

        [...items].reverse().forEach((item, index) => {
            const angle = (item.weight / totalWeight) * 360;
            const startAngle = (currentAngle * Math.PI) / 180;
            const endAngle = ((currentAngle + angle) * Math.PI) / 180;

            // Assign color to item if not already set
            if (!item.color) {
                item.color = `hsl(${index * 60}, 70%, 50%)`;
            }

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const startX = centerX + radius * Math.cos(startAngle);
            const startY = centerY + radius * Math.sin(startAngle);
            const endX = centerX + radius * Math.cos(endAngle);
            const endY = centerY + radius * Math.sin(endAngle);
            const largeArcFlag = angle > 180 ? 1 : 0;
            const d = `M ${centerX},${centerY} L ${startX},${startY} A ${radius},${radius} 0 ${largeArcFlag},1 ${endX},${endY} Z`;
            path.setAttribute('d', d);
            path.setAttribute('fill', item.color);
            wheel.appendChild(path);

            const midAngle = (currentAngle + angle / 2) * (Math.PI / 180);
            const textRadius = angle < 30 ? radius * 0.5 : radius * 0.7;
            const textX = centerX + textRadius * Math.cos(midAngle);
            const textY = centerY + textRadius * Math.sin(midAngle);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', textX);
            text.setAttribute('y', textY);
            text.setAttribute('fill', '#ffffff');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('font-size', angle < 30 ? '12' : '16');
            text.setAttribute('transform', `rotate(${currentAngle + angle / 2}, ${textX}, ${textY})`);
            text.textContent = item.name;
            wheel.appendChild(text);

            currentAngle += angle;
        });

        wheel.style.transform = `rotate(${lastRotation}deg)`;
        updateItemList(); // Update item list to reflect colors
        saveData(); // Save items with colors
    }

    updateWheel();
});
