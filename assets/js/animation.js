document.getElementById('openButton').addEventListener('click', function () {
    const driveSection = document.getElementById('drive');
    const nextSection = document.getElementById('next-section');

    // 문 열기 애니메이션 및 섹션 전환 애니메이션 적용
    driveSection.classList.add('opening');

    // 문 열림 애니메이션이 끝난 후 다음 섹션 보이기
    setTimeout(function () {
        nextSection.classList.add('visible');
        driveSection.style.display = 'none'; // 첫 번째 섹션 숨기기
    }, 2000); // 문 열림 애니메이션 시간과 맞춤
});
