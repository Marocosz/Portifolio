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
    // MÓDULO DE ANIMAÇÃO DE SCROLL (VERSÃO SUAVIZADA)
    // =============================================
    const scrollAnimationModule = (() => {
        const titleWrappers = document.querySelectorAll('.title-wrapper');
        const smoothingFactor = 0.04; // Fator de suavização. Ajuste este valor.
        let animationFrameId;

        // Esta função agora APENAS define os alvos da animação
        function updateAnimationTargets() {
            const windowHeight = window.innerHeight;

            titleWrappers.forEach(wrapper => {
                const title = wrapper.querySelector('.section-title');
                if (!title) return;

                const wrapperRect = wrapper.getBoundingClientRect();
                const animationStartPoint = windowHeight;
                const animationEndPoint = windowHeight * 0.4;

                if (wrapperRect.top < animationStartPoint && wrapperRect.top > -wrapperRect.height) {
                    const progressRange = animationStartPoint - animationEndPoint;
                    const progress = animationStartPoint - wrapperRect.top;
                    let animationProgress = progress / progressRange;
                    animationProgress = Math.max(0, Math.min(1, animationProgress));

                    // Define os alvos sem aplicar o estilo diretamente
                    title.targetX = -100 * (1 - animationProgress);
                    title.targetOpacity = Math.pow(animationProgress, 3);
                }
            });
        }

        // Esta nova função roda continuamente para criar a animação suave
        function smoothAnimationLoop() {
            titleWrappers.forEach(wrapper => {
                const title = wrapper.querySelector('.section-title');
                if (!title) return;

                // Move a posição atual um pouco em direção ao alvo
                let deltaX = title.targetX - title.currentX;
                title.currentX += deltaX * smoothingFactor;

                // Move a opacidade atual um pouco em direção ao alvo
                let deltaOpacity = title.targetOpacity - title.currentOpacity;
                title.currentOpacity += deltaOpacity * smoothingFactor;

                // Para de calcular quando estiver muito próximo para otimizar
                if (Math.abs(deltaX) < 0.01) title.currentX = title.targetX;
                if (Math.abs(deltaOpacity) < 0.01) title.currentOpacity = title.targetOpacity;

                // Aplica os estilos suavizados
                title.style.transform = `translateX(${title.currentX}%)`;
                title.style.opacity = title.currentOpacity;
            });

            animationFrameId = requestAnimationFrame(smoothAnimationLoop);
        }

        function init() {
            if (titleWrappers.length === 0) return;

            titleWrappers.forEach(wrapper => {
                const title = wrapper.querySelector('.section-title');
                if (title) {
                    // Prepara o título com as propriedades necessárias
                    title.targetX = -100;
                    title.currentX = -100;
                    title.targetOpacity = 0;
                    title.currentOpacity = 0;
                    title.style.willChange = 'transform, opacity';
                }
            });

            // Ouve o scroll para ATUALIZAR OS ALVOS
            window.addEventListener('scroll', updateAnimationTargets);

            // Inicia o loop de animação que roda independentemente
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            smoothAnimationLoop();
            updateAnimationTargets(); // Roda uma vez para definir o estado inicial
        }

        return { init };
    })();


    // =============================================
    // MÓDULO DE ANIMAÇÃO EXCLUSIVO PARA A IMAGEM
    // =============================================
    const imageAnimationModule = (() => {
        let imageWrapper;
        const smoothingFactor = 0.02; // Fator de suavização da animação
        let animationFrameId;

        // Esta é a função que roda em loop para criar a animação suave
        function smoothAnimate() {
            if (!imageWrapper) return;

            // Calcula a distância que a imagem precisa percorrer
            let deltaX = imageWrapper.targetX - imageWrapper.currentX;
            let deltaOpacity = imageWrapper.targetOpacity - imageWrapper.currentOpacity;

            // Move a imagem uma fração dessa distância a cada frame
            imageWrapper.currentX += deltaX * smoothingFactor;
            imageWrapper.currentOpacity += deltaOpacity * smoothingFactor;

            // Aplica os estilos
            imageWrapper.style.transform = `translateX(${imageWrapper.currentX}%)`;
            imageWrapper.style.opacity = imageWrapper.currentOpacity;

            // Continua o loop
            animationFrameId = requestAnimationFrame(smoothAnimate);
        }

        function init() {
            imageWrapper = document.querySelector('.image-to-animate');
            if (!imageWrapper) return;

            // Define as propriedades iniciais no próprio elemento
            imageWrapper.targetX = 100; // Alvo inicial: 100% para a direita
            imageWrapper.currentX = 100;
            imageWrapper.targetOpacity = 0;
            imageWrapper.currentOpacity = 0;
            imageWrapper.style.opacity = '0'; // Garante o estado visual inicial
            imageWrapper.style.willChange = 'transform, opacity';

            // O Observer apenas define o ALVO da animação
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Quando entra na tela, o alvo é a posição final (0% e opacidade 1)
                        imageWrapper.targetX = 0;
                        imageWrapper.targetOpacity = 1;
                    } else {
                        // Quando sai, o alvo volta a ser a posição inicial
                        imageWrapper.targetX = 100;
                        imageWrapper.targetOpacity = 0;
                    }
                });
            }, {
                threshold: 0.1 // Gatilho com 10% de visibilidade
            });

            observer.observe(imageWrapper);

            // Inicia o loop de animação contínuo
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            smoothAnimate();
        }

        return { init };
    })();

    // =============================================
    // MÓDULO "SLIDE-UP" SUAVE PARA CONTEÚDO (MÚLTIPLOS ELEMENTOS)
    // =============================================
    const contentAnimationModule = (() => {
        let elements;
        const smoothingFactor = 0.02; // Fator de suavização (ajuste aqui a velocidade)
        let animationFrameId;

        function smoothAnimate() {
            if (!elements || elements.length === 0) return;

            elements.forEach(el => {
                // Calcula a distância que o elemento precisa percorrer na vertical
                let deltaY = el.targetY - el.currentY;
                let deltaOpacity = el.targetOpacity - el.currentOpacity;

                // Move o elemento uma fração dessa distância a cada frame
                el.currentY += deltaY * smoothingFactor;
                el.currentOpacity += deltaOpacity * smoothingFactor;

                // Para de calcular quando estiver muito próximo para otimizar
                if (Math.abs(deltaY) < 0.01) el.currentY = el.targetY;
                if (Math.abs(deltaOpacity) < 0.01) el.currentOpacity = el.targetOpacity;

                // Aplica os estilos
                el.style.transform = `translateY(${el.currentY}px)`;
                el.style.opacity = el.currentOpacity;
            });

            animationFrameId = requestAnimationFrame(smoothAnimate);
        }

        function init() {
            elements = document.querySelectorAll('.smooth-slide-up');
            if (!elements || elements.length === 0) return;

            elements.forEach(el => {
                // Define as propriedades iniciais em cada elemento
                el.targetY = 80; // Alvo inicial: 80px para baixo
                el.currentY = 80;
                el.targetOpacity = 0;
                el.currentOpacity = 0;
                el.style.opacity = '0'; // Garante o estado visual inicial
                el.style.willChange = 'transform, opacity';
            });

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Quando entra na tela, o alvo é a posição final
                        entry.target.targetY = 0;
                        entry.target.targetOpacity = 1;
                    } else {
                        // Quando sai, o alvo volta a ser a posição inicial
                        entry.target.targetY = 80;
                        entry.target.targetOpacity = 0;
                    }
                });
            }, {
                threshold: 0.1
            });

            elements.forEach(el => observer.observe(el));

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            smoothAnimate();
        }

        return { init };
    })();

    // =============================================
    // MÓDULO DA TIMELINE INTERATIVA (VERSÃO FINAL E ROBUSTA)
    // =============================================
    const timelineModule = (() => {
        let timelineItems;
        let descriptionBox;
        let contentWrapper;
        let timelineText;
        let timelineImage;

        function handleItemClick(e) {
            const clickedItem = e.currentTarget;

            const isAlreadyActive = clickedItem.classList.contains('active');

            // Remove a classe 'active' de todos os itens e da caixa
            timelineItems.forEach(item => item.classList.remove('active'));
            descriptionBox.classList.remove('active');

            // Se clicou em um item que já estava ativo, apenas o desativa
            if (isAlreadyActive) {
                contentWrapper.classList.add('fading');
                setTimeout(() => {
                    timelineText.textContent = 'Clique em um marco para ver os detalhes.';
                    timelineImage.style.display = 'none';
                    contentWrapper.classList.remove('fading');
                }, 400);
                return;
            }

            // Se clicou em um novo item, ativa-o
            clickedItem.classList.add('active');

            // 1. Pegar posições
            const dot = clickedItem.querySelector('.timeline-dot');
            const boxRect = descriptionBox.getBoundingClientRect();
            const dotRect = dot.getBoundingClientRect();

            // 2. Calcular a linha contínua
            const frameTopY = boxRect.top - 10; // Onde a moldura começa
            const connectorStartY = dotRect.bottom; // De onde a linha sai

            const connectorHeight = frameTopY - connectorStartY;
            const connectorTop = connectorStartY - boxRect.top;
            const connectorLeft = (dotRect.left + dotRect.width / 2) - boxRect.left;

            // 3. Enviar os valores para o CSS
            descriptionBox.style.setProperty('--connector-left', `${connectorLeft}px`);
            descriptionBox.style.setProperty('--connector-top', `${connectorTop}px`);
            descriptionBox.style.setProperty('--connector-height', `${connectorHeight}px`);

            // 4. Atualizar o conteúdo
            const newDescription = clickedItem.dataset.description;
            const newImage = clickedItem.dataset.image;

            contentWrapper.classList.add('fading');
            descriptionBox.classList.add('active');

            setTimeout(() => {
                timelineText.textContent = newDescription;
                if (newImage) {
                    timelineImage.src = newImage;
                    timelineImage.style.display = 'block';
                } else {
                    timelineImage.style.display = 'none';
                }
                contentWrapper.classList.remove('fading');
            }, 400);
        }

        function init() {
            timelineItems = document.querySelectorAll('.timeline-item');
            descriptionBox = document.querySelector('.timeline-description-box');
            if (!timelineItems.length || !descriptionBox) return;

            contentWrapper = descriptionBox.querySelector('.timeline-content-wrapper');
            timelineText = descriptionBox.querySelector('.timeline-text');
            timelineImage = descriptionBox.querySelector('.timeline-image');
            if (!contentWrapper || !timelineText || !timelineImage) return;

            timelineItems.forEach(item => {
                item.addEventListener('click', handleItemClick);
            });
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
    scrollAnimationModule.init();
    imageAnimationModule.init();
    contentAnimationModule.init();
    timelineModule.init();
});