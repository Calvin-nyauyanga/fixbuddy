// Example authentication check for admin
const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'admin') {
    alert('Access denied. Admins only.');
    window.location.href = '../Main Dashboard/UserLoginPage.html';
}