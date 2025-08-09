document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // MÓDULO DO CURSOR CUSTOMIZADO (VERSÃO SIMPLES E RÁPIDA)
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
            animate();
        }

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
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
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (window.pageYOffset >= sectionTop - window.innerHeight / 2) {
                    currentSection = section.getAttribute('id');
                }
            });
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.dataset.section === currentSection) {
                    link.classList.add('active');
                }
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
    // MÓDULO DE ANIMAÇÃO DO TÍTULO
    // =============================================
    const heroTitleModule = (() => {
        function init() {
            const title = document.querySelector('.hero-title');
            if (title && title.querySelector('.hero-title-line')) {
                const lines = title.querySelectorAll('.hero-title-line');
                lines.forEach((line, index) => {
                    line.style.animationDelay = `${index * 0.3}s`;
                });
            }
        }
        return { init };
    })();

    // =============================================
    // MÓDULO DE ANIMAÇÕES DE SCROLL (REVEAL)
    // =============================================
    const scrollAnimationModule = (() => {
        const revealElements = document.querySelectorAll('.reveal-text, .timeline-container');

        const revealOnScroll = () => {
            const windowHeight = window.innerHeight;

            revealElements.forEach(el => {
                const rect = el.getBoundingClientRect();

                // MUDANÇA AQUI: Lógica para verificar se o elemento está visível
                // Condição para ser visível: O topo do elemento está acima da parte de baixo da tela
                // E a base do elemento está abaixo da parte de cima da tela.
                const isVisible = rect.top < windowHeight && rect.bottom > 0;

                if (isVisible) {
                    // Se está visível, adiciona a classe para animar a entrada
                    el.classList.add('visible');
                } else {
                    // Se não está visível (saiu da tela), remove a classe para reverter a animação
                    el.classList.remove('visible');
                }
            });
        };

        window.addEventListener('scroll', revealOnScroll);
        window.addEventListener('load', revealOnScroll);
        // Adiciona um listener para resize também, para garantir o funcionamento
        window.addEventListener('resize', revealOnScroll);

        // O return pode ser vazio pois o módulo se auto-inicializa
        return {};
    })();

    // =============================================
    // MÓDULO DA LINHA DO TEMPO
    // =============================================
    const timelineModule = (() => {
        const timelineItems = document.querySelectorAll('.timeline-item');
        const descriptionBox = document.querySelector('.timeline-description-box p');
        function init() {
            if (!timelineItems || timelineItems.length === 0 || !descriptionBox) return;
            timelineItems.forEach(item => {
                item.addEventListener('click', () => {
                    timelineItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    descriptionBox.textContent = item.dataset.description;
                });
            });
        }
        return { init };
    })();

    // =============================================
    // MÓDULO DE PROJETOS (FILTRO E MODAL)
    // =============================================
    const projectsModule = (() => {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');
        const modal = document.getElementById('project-modal');
        const closeModalBtn = document.querySelector('.close-modal');
        function filterProjects() {
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const filter = btn.dataset.filter;
                    projectCards.forEach(card => {
                        card.classList.add('hide');
                        setTimeout(() => {
                            if (filter === 'all' || card.dataset.category === filter) {
                                card.classList.remove('hide');
                            }
                        }, 150);
                    });
                });
            });
        }
        function setupModal() {
            if (!modal) return;
            projectCards.forEach(card => {
                card.addEventListener('click', () => {
                    const title = card.querySelector('h3').textContent;
                    const imgSrc = card.querySelector('img').dataset.src || card.querySelector('img').src;
                    document.getElementById('modal-title').textContent = title;
                    document.getElementById('modal-img').src = imgSrc;
                    modal.classList.add('show');
                });
            });
            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', () => modal.classList.remove('show'));
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('show');
                    }
                });
            }
        }
        function init() {
            if (filterBtns.length > 0) filterProjects();
            if (modal) setupModal();
        }
        return { init };
    })();

    // =============================================
    // MÓDULO DO LAB EXPERIMENTAL (NEURAL NETWORK)
    // =============================================
    const labModule = (() => {
        const nnContainer = document.querySelector('.neural-network');
        function init() {
            if (!nnContainer) return;
            nnContainer.innerHTML = '';
            for (let i = 0; i < 3; i++) {
                const layer = document.createElement('div');
                layer.className = 'nn-layer';
                const numNeurons = (i === 0) ? 3 : (i === 1) ? 4 : 2;
                for (let j = 0; j < numNeurons; j++) {
                    const neuron = document.createElement('div');
                    neuron.className = 'neuron';
                    layer.appendChild(neuron);
                }
                nnContainer.appendChild(layer);
            }
            const neurons = document.querySelectorAll('.neuron');
            neurons.forEach(neuron => {
                neuron.addEventListener('mouseenter', () => {
                    neuron.classList.add('active');
                    setTimeout(() => neuron.classList.remove('active'), 1000);
                });
            });
        }
        return { init };
    })();

    // =============================================
    // MÓDULO DO TERMINAL
    // =============================================
    const terminalModule = (() => {
        const terminal = document.querySelector('.terminal');
        const terminalBody = document.getElementById('terminal-body');
        const terminalOutput = document.getElementById('terminal-output');
        const terminalInput = document.getElementById('terminal-input');

        if (!terminal || !terminalBody || !terminalOutput || !terminalInput) {
            return { init: () => { } };
        }

        const commands = {
            'ajuda': 'Comandos disponíveis:<br>`sobre` - mostra uma bio.<br>`skills` - lista minhas tecnologias.<br>`contato` - como entrar em contato.<br>`limpar` - limpa o terminal.',
            'sobre': 'Sou um desenvolvedor focado em IA e automação...',
            'skills': 'JavaScript (ES6+), Python, HTML5, CSS3, Node.js...',
            'contato': 'Ótimo! Você pode me enviar um email para <a href="mailto:seuemail@example.com">seuemail@example.com</a>...',
            'limpar': () => { terminalOutput.innerHTML = ''; return true; }
        };
        const initialMessage = `<p>Bem-vindo ao meu terminal interativo!</p><p>Digite 'ajuda' para ver a lista de comandos.</p>`;

        function printToTerminal(htmlContent) {
            const p = document.createElement('p');
            p.innerHTML = htmlContent;
            terminalOutput.appendChild(p);
        }

        function handleCommand() {
            const command = terminalInput.value.trim().toLowerCase();
            if (command === '') return;
            printToTerminal(`<span style="color: var(--color-primary)">visitante@portfolio:~$</span> ${command}`);
            if (commands[command]) {
                const response = commands[command];
                if (typeof response === 'function') {
                    response();
                } else {
                    printToTerminal(response);
                }
            } else {
                printToTerminal(`Comando não encontrado: ${command}. Digite 'ajuda'.`);
            }
            terminalInput.value = '';
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }

        function init() {
            printToTerminal(initialMessage);
            terminal.addEventListener('click', () => terminalInput.focus());
            terminalInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleCommand();
            });
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    terminalInput.focus();
                }
            }, { threshold: 0.5 });
            observer.observe(terminal);
        }
        return { init };
    })();

    // =============================================
    // MÓDULO DE LAZY LOADING DE IMAGENS
    // =============================================
    const lazyLoadModule = (() => {
        const lazyImages = document.querySelectorAll('img.lazy-load');
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-load');
                    observer.unobserve(img);
                }
            });
        });
        function init() {
            lazyImages.forEach(img => observer.observe(img));
        }
        return { init };
    })();

    // =============================================
    // INICIALIZA TODOS OS MÓDULOS
    // =============================================
    cursorModule.init();
    particleModule.init();
    navigationModule.init();
    scrollAnimationModule.init();
    heroTitleModule.init();
    timelineModule.init();
    projectsModule.init();
    labModule.init();
    terminalModule.init();
    lazyLoadModule.init();
});