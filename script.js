document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // MÓDULO DO CURSOR CUSTOMIZADO
    // =============================================
    const cursorModule = (() => {
        const cursor = document.querySelector('.cursor');
        const follower = document.querySelector('.cursor-follower');
        const interactiveElements = 'a, button, [data-section], .timeline-item, .project-card, .terminal-buttons span, .filter-btn';

        function moveCursor(e) {
            if (cursor) {
                cursor.style.left = `${e.clientX}px`;
                cursor.style.top = `${e.clientY}px`;
            }
            if (follower) {
                follower.style.left = `${e.clientX}px`;
                follower.style.top = `${e.clientY}px`;
            }
        }

        function setupEventListeners() {
            // Apenas adiciona o listener se os elementos do cursor existirem
            if (!cursor && !follower) return;

            window.addEventListener('mousemove', moveCursor);

            document.querySelectorAll(interactiveElements).forEach(el => {
                el.addEventListener('mouseenter', () => {
                    if (cursor) cursor.classList.add('active');
                    if (follower) follower.classList.add('active');
                });
                el.addEventListener('mouseleave', () => {
                    if (cursor) cursor.classList.remove('active');
                    if (follower) follower.classList.remove('active');
                });
            });

            const terminalBody = document.querySelector('.terminal');
            if (terminalBody) {
                terminalBody.addEventListener('mouseenter', () => { if (follower) follower.style.borderWidth = '2px'; });
                terminalBody.addEventListener('mouseleave', () => { if (follower) follower.style.borderWidth = '1px'; });
            }
        }

        return { init: setupEventListeners };
    })();

    // =============================================
    // MÓDULO DO FUNDO ANIMADO
    // =============================================
    const particleModule = (() => {
        const canvas = document.getElementById('particle-canvas');
        if (!canvas) return { init: () => { } };

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const nodeSpeed = 0.75;
        const baseMaxDistance = 100;
        const pulseAmountDistance = 50;
        const pulseSpeedDistance = 0.002;
        const maxNumNodes = 300;
        const minNumNodes = 250;
        const pulseSpeedDensity = 0.005;
        const baseHue = 260;
        const hueVariation = 40;
        const scrollHueShift = 80;
        const saturation = 40;
        const lightness = 35;

        let time = 0;
        let nodes = [];
        let scrollHueOffset = 0;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function handleScroll() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            if (scrollHeight > 0) {
                const scrollPercent = scrollTop / scrollHeight;
                scrollHueOffset = scrollPercent * scrollHueShift;
            }
        }

        class Node {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2.5 + 1;
                this.speedX = (Math.random() - 0.5) * nodeSpeed;
                this.speedY = (Math.random() - 0.5) * nodeSpeed;
                this.baseHue = baseHue + (Math.random() - 0.5) * hueVariation;
                this.opacity = 0;
            }

            update(targetOpacity) {
                this.opacity += (targetOpacity - this.opacity) * 0.05;
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
                this.x += this.speedX;
                this.y += this.speedY;
            }

            draw() {
                if (this.opacity < 0.01) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${this.baseHue + scrollHueOffset}, ${saturation}%, ${lightness}%, ${this.opacity * 0.9})`;
                ctx.fill();
            }
        }

        function drawConnections(currentMaxDistance, nodesToConnect) {
            for (let i = 0; i < nodesToConnect.length; i++) {
                if (nodesToConnect[i].opacity < 0.01) continue;
                for (let j = i + 1; j < nodesToConnect.length; j++) {
                    if (nodesToConnect[j].opacity < 0.01) continue;
                    const distance = Math.hypot(nodesToConnect[i].x - nodesToConnect[j].x, nodesToConnect[i].y - nodesToConnect[j].y);
                    if (distance < currentMaxDistance) {
                        const distanceOpacity = 1 - (distance / currentMaxDistance);
                        const finalOpacity = distanceOpacity * Math.min(nodesToConnect[i].opacity, nodesToConnect[j].opacity);
                        if (finalOpacity > 0) {
                            const avgHue = (nodesToConnect[i].baseHue + nodesToConnect[j].baseHue) / 2;
                            ctx.beginPath();
                            ctx.moveTo(nodesToConnect[i].x, nodesToConnect[i].y);
                            ctx.lineTo(nodesToConnect[j].x, nodesToConnect[j].y);
                            ctx.strokeStyle = `hsla(${avgHue + scrollHueOffset}, ${saturation}%, ${lightness}%, ${finalOpacity * 0.8})`;
                            ctx.lineWidth = 0.7;
                            ctx.stroke();
                        }
                    }
                }
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const distancePulse = Math.sin(time * pulseSpeedDistance) * pulseAmountDistance;
            const currentMaxDistance = baseMaxDistance + distancePulse;
            const densityPulse = (Math.sin(time * pulseSpeedDensity) + 1) / 2;
            const targetVisibleNodeCount = Math.floor(minNumNodes + (maxNumNodes - minNumNodes) * densityPulse);

            nodes.forEach((node, index) => {
                const targetOpacity = index < targetVisibleNodeCount ? 1 : 0;
                node.update(targetOpacity);
                node.draw();
            });
            drawConnections(currentMaxDistance, nodes);
            time++;
            animationFrameId = requestAnimationFrame(animate);
        }

        function init() {
            resizeCanvas();
            nodes = [];
            for (let i = 0; i < maxNumNodes; i++) {
                nodes.push(new Node());
            }
            window.addEventListener('scroll', handleScroll);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            // Inicia a animação apenas se a aba estiver visível
            if (document.visibilityState === 'visible') {
                animate();
            }
        }

        // ALTERAÇÃO: Pausa a animação que consome CPU quando o usuário não está vendo a aba.
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null; // Limpa o ID para garantir
            } else if (!animationFrameId) { // Retoma apenas se não estiver rodando
                animate();
            }
        });

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            // Garante que a animação pare antes de reiniciar
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            resizeTimer = setTimeout(init, 250);
        });

        return { init };
    })();

    // =============================================
    // MÓDULO DE NAVEGAÇÃO E SCROLL
    // =============================================
    const navigationModule = (() => {
        const navLinks = document.querySelectorAll('.main-nav li');
        const sections = document.querySelectorAll('section');

        function setActiveLink() {
            let currentSection = '';
            const triggerPoint = window.innerHeight / 2;
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (window.pageYOffset >= sectionTop - triggerPoint) {
                    currentSection = section.getAttribute('id');
                }
            });
            navLinks.forEach(link => {
                const isActive = link.dataset.section === currentSection;
                link.classList.toggle('active', isActive);
            });
        }

        function init() {
            if (!navLinks || navLinks.length === 0) return;
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    const sectionId = link.dataset.section;
                    const sectionElement = document.getElementById(sectionId);
                    if (sectionElement) {
                        sectionElement.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
            window.addEventListener('scroll', setActiveLink);
            setActiveLink();
        }
        return { init };
    })();

    // =============================================
    // MÓDULO DE LAZY LOADING DE IMAGENS
    // =============================================
    const lazyLoadModule = (() => {
        const lazyImages = document.querySelectorAll('img.lazy-load');
        if (lazyImages.length === 0) return { init: () => { } };

        // ALTERAÇÃO: Melhora a experiência do usuário fazendo as imagens carregarem
        // um pouco antes de aparecerem na tela.
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-load');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '0px 0px 200px 0px' // Inicia o carregamento 200px antes da imagem entrar na tela
        });

        function init() {
            lazyImages.forEach(img => observer.observe(img));
        }
        return { init };
    })();

    // =============================================
    // INICIALIZAÇÃO DOS MÓDULOS
    // =============================================
    cursorModule.init();
    particleModule.init();
    navigationModule.init();
    lazyLoadModule.init();

    // Os módulos abaixo não foram definidos no código fornecido.
    // Suas inicializações foram removidas para evitar erros de "função não definida".
    // scrollAnimationModule.init();
    // heroTitleModule.init();
    // timelineModule.init();
    // projectsModule.init();
    // labModule.init();
    // terminalModule.init();
});