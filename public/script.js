document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
});

function loadReviews() {
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;

    fetch('/api/reviews')
        .then(res => res.json())
        .then(reviews => {
            reviewsList.innerHTML = reviews.map(r => `
                <div class="review-item">
                    <strong style="color: #d4b26f;"> ${r.username}</strong>
                    <p style="margin: 5px 0 0 0; color: #f4eccf;">${r.review_text}</p>
                </div>
            `).join('');
        })
        .catch(err => console.error("שגיאה בטעינת ביקורות:", err));
}