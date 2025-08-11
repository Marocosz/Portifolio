document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // MÓDULO DO CURSOR CUSTOMIZADO
    // =============================================
    const cursorModule = (() => {
        const cursor = document.querySelector('.cursor');
        const follower = document.querySelector('.cursor-follower');
        const interactiveElements = 'a, button, [data-section], .timeline-item, .project-card, .terminal-buttons span, .filter-btn, #contact a';

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
    // MÓDULO DO FUNDO ANIMADO (VERSÃO COM GRADIENTE ESCURO E SUTIL)
    // =============================================
    const particleModule = (() => {
        const canvas = document.getElementById('particle-canvas');
        if (!canvas) return { init: () => { } };

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const numLines = 100;
        const lineSpeed = 1;

        let lines = [];
        let gradient;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            createGradient();
            initializeLines();
        }

        // REFACTOR: Gradiente com opacidade reduzida para um fundo mais escuro
        function createGradient() {
            gradient = ctx.createLinearGradient(canvas.width, 0, 0, 0);
            gradient.addColorStop(0, 'rgba(0, 255, 150, 0.06)');   // Verde (direita) - Opacidade de 15% para 6%
            gradient.addColorStop(0.5, 'rgba(0, 180, 220, 0.04)');  // Ciano (meio) - Opacidade de 10% para 4%
            gradient.addColorStop(1, 'rgba(0, 120, 255, 0.08)');   // Azul (esquerda) - Opacidade de 20% para 8%
        }

        class EnergyLine {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.z = Math.random() * 20 + 1; // Profundidade
                this.angle = Math.random() * Math.PI * 2;
            }

            update() {
                const speed = (lineSpeed * (22 - this.z)) / 15;
                this.x += Math.cos(this.angle) * speed;
                this.y += Math.sin(this.angle) * speed;

                if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                    const side = Math.floor(Math.random() * 4);
                    switch (side) {
                        case 0: this.x = 0; this.y = Math.random() * canvas.height; break;
                        case 1: this.x = canvas.width; this.y = Math.random() * canvas.height; break;
                        case 2: this.y = 0; this.x = Math.random() * canvas.width; break;
                        case 3: this.y = canvas.height; this.x = Math.random() * canvas.width; break;
                    }
                }
            }

            draw() {
                const length = (22 - this.z) * 5 + 10;
                // REFACTOR: Opacidade das linhas reduzida para serem mais sutis
                const opacity = (22 - this.z) / 80; // Divisor aumentado de 40 para 80
                const hue = 160 + (this.x / canvas.width) * 80;
                const lineWidth = (22 - this.z) / 10;

                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - Math.cos(this.angle) * length, this.y - Math.sin(this.angle) * length);

                ctx.strokeStyle = `hsla(${hue}, 90%, 60%, ${opacity})`;
                ctx.lineWidth = lineWidth;

                ctx.shadowColor = `hsla(${hue}, 90%, 60%, ${opacity * 0.5})`;
                ctx.shadowBlur = 10;

                ctx.stroke();
            }
        }

        function initializeLines() {
            lines = [];
            for (let i = 0; i < numLines; i++) {
                lines.push(new EnergyLine());
            }
        }

        function animate() {
            // REFACTOR: Efeito de rastro mais transparente para escurecer o fundo
            ctx.fillStyle = 'rgba(10, 10, 31, 0.15)'; // Opacidade aumentada de 0.1 para 0.15 para "limpar" mais
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            lines.forEach(line => {
                line.update();
                line.draw();
            });

            ctx.shadowBlur = 0;

            animationFrameId = requestAnimationFrame(animate);
        }

        function init() {
            resizeCanvas();
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            if (document.visibilityState === 'visible') {
                animate();
            }
        }

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            } else if (!animationFrameId) {
                animate();
            }
        });

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
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
    // MÓDULO DE LAZY LOADING DE IMAGENS (ATUALIZADO)
    // =============================================
    const lazyLoadModule = (() => {
        const lazyImages = document.querySelectorAll('img.lazy-load');

        if (lazyImages.length === 0) return { init: () => { } };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;

                    // Define o 'src' para começar o carregamento
                    img.src = img.dataset.src;

                    // NOVO: Adiciona um ouvinte para o evento 'load'
                    // A classe 'loaded' só é adicionada DEPOIS que a imagem foi baixada
                    img.addEventListener('load', () => {
                        img.classList.add('loaded');
                    });

                    // Remove a classe 'lazy-load' e para de observar
                    img.classList.remove('lazy-load');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '0px 0px 200px 0px'
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
    // MÓDULO DA TIMELINE INTERATIVA (COM RESET AO SAIR DA SEÇÃO)
    // =============================================
    const timelineModule = (() => {
        let timelineItems;
        let frameWrapper;
        let contentWrapper;
        let timelineText;
        let timelineImage;
        let descriptionBox;

        // NOVO: Função centralizada para resetar o estado
        function resetTimelineState() {
            timelineItems.forEach(item => item.classList.remove('active'));
            if (frameWrapper) {
                frameWrapper.classList.remove('active');
            }

            // Se o conteúdo já estiver desaparecendo, não faz nada
            if (contentWrapper && contentWrapper.classList.contains('fading')) return;

            if (contentWrapper) {
                contentWrapper.classList.add('fading');
                setTimeout(() => {
                    timelineText.textContent = 'Clique em um marco para ver os detalhes.';
                    timelineImage.style.display = 'none';
                    contentWrapper.classList.remove('fading');
                }, 400);
            }
        }

        function handleItemClick(e) {
            const clickedItem = e.currentTarget;
            const isAlreadyActive = clickedItem.classList.contains('active');

            // Se clicou em um item que já estava ativo, apenas o desativa.
            if (isAlreadyActive) {
                resetTimelineState();
                return;
            }

            // Se clicou em um novo item, primeiro limpa o estado anterior
            timelineItems.forEach(item => item.classList.remove('active'));
            frameWrapper.classList.remove('active'); // Garante que a animação possa re-iniciar

            // Adiciona um pequeno delay para a reanimação funcionar
            setTimeout(() => {
                clickedItem.classList.add('active');
                frameWrapper.classList.add('active');

                // --- Lógica de cálculo (permanece a mesma) ---
                const dot = clickedItem.querySelector('.timeline-dot');
                const year = clickedItem.querySelector('.timeline-year');
                const dotRect = dot.getBoundingClientRect();
                const yearRect = year.getBoundingClientRect();
                const wrapperRect = frameWrapper.getBoundingClientRect();

                const gap = 6;
                const frameTopY = wrapperRect.top + (frameWrapper.offsetHeight - descriptionBox.offsetHeight) / 2 - 10;
                const isYearAbove = yearRect.top < dotRect.top;

                const line1_start = isYearAbove ? dotRect.bottom : dotRect.bottom;
                const line1_end = isYearAbove ? yearRect.top - gap : yearRect.top - gap;

                const line2_start = isYearAbove ? yearRect.bottom + gap : yearRect.bottom + gap;
                const line2_end = frameTopY;

                const line1_top = line1_start - wrapperRect.top;
                const line1_height = line1_end - line1_start;
                const line2_top = line2_start - wrapperRect.top;
                const line2_height = line2_end - line2_start;

                const connectorLeft = (dotRect.left + dotRect.width / 2) - wrapperRect.left;

                frameWrapper.style.setProperty('--connector-left', `${connectorLeft}px`);
                if (isYearAbove) {
                    frameWrapper.style.setProperty('--line1-top', `${line2_top}px`);
                    frameWrapper.style.setProperty('--line1-height', `${line2_height > 0 ? line2_height : 0}px`);
                    frameWrapper.style.setProperty('--line2-top', `${line1_top}px`);
                    frameWrapper.style.setProperty('--line2-height', `${line1_height > 0 ? line1_height : 0}px`);
                } else {
                    frameWrapper.style.setProperty('--line1-top', `${line1_top}px`);
                    frameWrapper.style.setProperty('--line1-height', `${line1_height > 0 ? line1_height : 0}px`);
                    frameWrapper.style.setProperty('--line2-top', `${line2_top}px`);
                    frameWrapper.style.setProperty('--line2-height', `${line2_height > 0 ? line2_height : 0}px`);
                }

                // Atualização do conteúdo
                const newDescription = clickedItem.dataset.description;
                const newImage = clickedItem.dataset.image;

                contentWrapper.classList.add('fading');
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

            }, 50); // Delay mínimo para o navegador processar a remoção da classe .active
        }

        function init() {
            const timelineSection = document.getElementById('timeline');
            if (!timelineSection) return;

            timelineItems = timelineSection.querySelectorAll('.timeline-item');
            frameWrapper = timelineSection.querySelector('.timeline-frame-wrapper');
            if (!timelineItems.length || !frameWrapper) return;

            descriptionBox = frameWrapper.querySelector('.timeline-description-box');
            contentWrapper = frameWrapper.querySelector('.timeline-content-wrapper');
            timelineText = frameWrapper.querySelector('.timeline-text');
            timelineImage = frameWrapper.querySelector('.timeline-image');

            if (!descriptionBox || !contentWrapper || !timelineText || !timelineImage) return;

            timelineItems.forEach(item => {
                item.addEventListener('click', handleItemClick);
            });

            // NOVO: Observer para resetar a timeline ao sair da tela
            const sectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    // Se a seção da timeline NÃO está mais visível...
                    if (!entry.isIntersecting) {
                        // ...chama a função de reset.
                        resetTimelineState();
                    }
                });
            }, {
                threshold: 0.05 // Reseta quando menos de 5% da seção está visível
            });

            sectionObserver.observe(timelineSection);
        }

        return { init };
    })();

    // =============================================
    // MÓDULO DE FERRAMENTAS INTERATIVO
    // =============================================
    const toolsModule = (() => {
        let toolCards, nameDisplay, descDisplay, descPanel;

        function updateDescription(e) {
            const card = e.currentTarget;
            const name = card.dataset.toolName;
            const description = card.dataset.toolDescription;

            // Adiciona um efeito de fade para a troca de texto
            descPanel.classList.add('fading');

            setTimeout(() => {
                nameDisplay.textContent = name;
                descDisplay.textContent = description;
                descPanel.classList.remove('fading');
            }, 200);
        }

        function setActive(e) {
            toolCards.forEach(card => card.classList.remove('active'));
            e.currentTarget.classList.add('active');
        }

        function init() {
            toolCards = document.querySelectorAll('.tool-card');
            nameDisplay = document.getElementById('tool-name-display');
            descDisplay = document.getElementById('tool-desc-display');
            descPanel = document.querySelector('.tool-description-panel');

            if (toolCards.length === 0 || !nameDisplay || !descDisplay) return;

            toolCards.forEach(card => {
                card.addEventListener('mouseenter', updateDescription);
                card.addEventListener('click', setActive);
            });
        }

        return { init };
    })();

    // =============================================
    // MÓDULO DE PROJETOS (FILTROS E MODAL ATUALIZADO)
    // =============================================
    const projectsModule = (() => {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');
        const modal = document.getElementById('project-modal');

        if (!modal) {
            return { init: () => console.warn('Módulo de Projetos: Modal não encontrado.') };
        }

        const closeModalBtn = modal.querySelector('.close-modal');
        const modalImg = document.getElementById('modal-img');
        const modalProjectTitle = document.getElementById('modal-project-title');
        const modalPurposeDescription = document.getElementById('modal-purpose-description');
        const modalTechnologiesList = document.getElementById('modal-technologies-list');
        const modalGithubLink = document.getElementById('modal-github-link');

        function filterProjects(e) {
            const filterValue = e.target.dataset.filter;

            filterBtns.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            projectCards.forEach(card => {
                const cardCategories = card.dataset.category || '';
                const shouldShow = filterValue === 'all' || cardCategories.includes(filterValue);

                card.style.display = shouldShow ? 'block' : 'none';
            });
        }

        function openModal(e) {
            if (e.target.closest('.project-link')) {
                return;
            }

            const card = e.currentTarget;
            const cardImg = card.querySelector('img');

            // Novos atributos para o modal
            const fullTitle = card.dataset.modalTitleFull || 'Título do Projeto';
            const purposeDescription = card.dataset.modalPurpose || 'Proposta não disponível.';
            const technologiesString = card.dataset.modalTechnologies || ''; // String "Nome:Explicação|Nome2:Explicação2"
            const githubLink = card.dataset.modalGithubLink || '#';

            // Preenche o modal
            if (cardImg) modalImg.src = cardImg.dataset.src || cardImg.src;

            modalProjectTitle.textContent = fullTitle;
            modalPurposeDescription.textContent = purposeDescription;
            modalGithubLink.href = githubLink;

            // Limpa as tags antigas e adiciona as novas
            modalTechnologiesList.innerHTML = ''; // Limpa o conteúdo anterior
            if (technologiesString) {
                const techItems = technologiesString.split('|').map(item => item.trim()); // Divide por pipe
                techItems.forEach(item => {
                    const parts = item.split(':'); // Divide Nome:Explicação
                    const techName = parts[0].trim();
                    const techExplanation = parts.length > 1 ? parts[1].trim() : '';

                    const techDiv = document.createElement('div');
                    techDiv.classList.add('tech-item'); // Container para nome e explicação

                    const nameSpan = document.createElement('span');
                    nameSpan.classList.add('tech-name');
                    nameSpan.textContent = techName;
                    techDiv.appendChild(nameSpan);

                    if (techExplanation) {
                        const explanationParagraph = document.createElement('p');
                        explanationParagraph.classList.add('tech-explanation');
                        explanationParagraph.textContent = techExplanation;
                        techDiv.appendChild(explanationParagraph);
                    }
                    modalTechnologiesList.appendChild(techDiv);
                });
            } else {
                modalTechnologiesList.textContent = 'Tecnologias não especificadas.';
            }

            modal.classList.add('show');
            document.body.style.overflow = 'hidden'; // Impede o scroll do body quando o modal está aberto
        }

        function closeModal() {
            modal.classList.remove('show');
            document.body.style.overflow = ''; // Restaura o scroll do body
        }

        function init() {
            if (filterBtns.length > 0) {
                filterBtns.forEach(btn => btn.addEventListener('click', filterProjects));
            }
            if (projectCards.length > 0) {
                projectCards.forEach(card => card.addEventListener('click', openModal));
            }
            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', closeModal);
            }

            modal.addEventListener('click', (e) => {
                if (e.target === modal) { // Se clicou no overlay, fecha o modal
                    closeModal();
                }
            });

            // Adiciona listener para fechar o modal com a tecla ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('show')) {
                    closeModal();
                }
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
    toolsModule.init();
    projectsModule.init();
});