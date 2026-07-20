
const body=document.body,html=document.documentElement;
window.addEventListener('load',()=>setTimeout(()=>document.querySelector('.loader')?.classList.add('hide'),350));
window.addEventListener('scroll',()=>document.querySelector('.site-header')?.classList.toggle('scrolled',scrollY>20));
document.querySelectorAll('[data-lang-toggle]').forEach(btn=>btn.addEventListener('click',()=>{
 body.classList.toggle('lang-en');const en=body.classList.contains('lang-en');
 document.querySelectorAll('[data-lang-toggle]').forEach(b=>b.textContent=en?'中文':'EN');
 html.lang=en?'en':'zh-CN';localStorage.setItem('joanneLang',en?'en':'zh')
}));
if(localStorage.getItem('joanneLang')==='en')document.querySelector('[data-lang-toggle]')?.click();
document.querySelectorAll('[data-theme-toggle]').forEach(btn=>btn.addEventListener('click',()=>{
 const dark=html.dataset.theme!=='dark';html.dataset.theme=dark?'dark':'light';
 document.querySelectorAll('[data-theme-toggle]').forEach(b=>b.textContent=dark?'☀':'☾');
 localStorage.setItem('joanneTheme',dark?'dark':'light')
}));
if(localStorage.getItem('joanneTheme')==='dark')document.querySelector('[data-theme-toggle]')?.click();
const observer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.1});
document.querySelectorAll('.reveal').forEach(e=>observer.observe(e));
const modal=document.querySelector('.modal'),modalImg=modal?.querySelector('img');
document.querySelectorAll('[data-lightbox]').forEach(x=>x.addEventListener('click',()=>{modalImg.src=x.dataset.lightbox;modal.classList.add('open')}));
modal?.addEventListener('click',e=>{if(e.target===modal||e.target.tagName==='BUTTON')modal.classList.remove('open')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')modal?.classList.remove('open')});
