// table.js

// 사고 다발 지역 데이터를 가져와서 표에 표시하는 함수
function loadAccidentData() {
    fetch('data/top20_accident_locations.json')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#accidentTable tbody');
            data.forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${item.사고지역위치명}</td>
                    <td>${item.사고건수}</td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching the accident data:', error));
        fetch('data/top20_accident_grouped.json')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#accidentTable tbody');
            data.forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${item.시군구명}</td>
                    <td>${item.사고건수}</td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching the accident data:', error));
}

// 페이지 로드 시 데이터를 로드하는 함수 호출
document.addEventListener('DOMContentLoaded', loadAccidentData);

