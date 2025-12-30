import AOS from 'aos';
import 'aos/dist/aos.css'; // 确保样式加载 (虽然我们在 scss 引入了，双保险)

// 1. 初始化 AOS 动画库
AOS.init( {
    once: true, // 动画只执行一次
    offset: 100, // 触发动画的偏移量
    duration: 800, // 动画持续时间
    easing: 'ease-out-cubic',
} );

// 2. 暗黑模式切换逻辑
const themeSwitch = document.getElementById( 'theme-switch' );
const icon = themeSwitch.querySelector( 'i' );

// 检查本地存储或系统偏好
const savedTheme = localStorage.getItem( 'theme' );
const systemDark = window.matchMedia( '(prefers-color-scheme: dark)' ).matches;

if ( savedTheme === 'dark' || ( !savedTheme && systemDark ) ) {
    document.documentElement.setAttribute( 'data-theme', 'dark' );
    icon.className = 'ri-sun-line';
}

themeSwitch.addEventListener( 'click', () => {
    const currentTheme = document.documentElement.getAttribute( 'data-theme' );
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute( 'data-theme', newTheme );
    localStorage.setItem( 'theme', newTheme );

    // 切换图标
    icon.className = newTheme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
} );

// 3. 移动端菜单逻辑
const menuToggle = document.getElementById( 'mobile-menu' );
const navLinks = document.getElementById( 'nav-links' );
const menuIcon = menuToggle.querySelector( 'i' );

menuToggle.addEventListener( 'click', () => {
    navLinks.classList.toggle( 'active' );

    // 切换汉堡图标与关闭图标
    if ( navLinks.classList.contains( 'active' ) ) {
        menuIcon.className = 'ri-close-line';
    } else {
        menuIcon.className = 'ri-menu-3-line';
    }
} );

// 点击链接后自动关闭菜单 (移动端体验优化)
document.querySelectorAll( '.nav-links a' ).forEach( link => {
    link.addEventListener( 'click', () => {
        navLinks.classList.remove( 'active' );
        menuIcon.className = 'ri-menu-3-line';
    } );
} );