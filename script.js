document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // MÓDULO DO CURSOR CUSTOMIZADO (ATUALIZADO)
    // =============================================
    const cursorModule = (() => {
        const cursor = document.querySelector('.cursor');
        const follower = document.querySelector('.cursor-follower');
        // Seletor para todos os elementos interativos
        const interactiveElements = 'a, button, [data-section], .shard, .project-card, .tool-card, .terminal-buttons span, .filter-btn';

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
            if (!cursor && !follower) return;

            window.addEventListener('mousemove', moveCursor);

            // Efeito de hover para elementos interativos gerais
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

            // -> LÓGICA ATUALIZADA PARA O TERMINAL
            const terminalArea = document.querySelector('.terminal');
            if (terminalArea) {
                terminalArea.addEventListener('mouseenter', () => {
                    // Adiciona a classe que ativa o estilo geométrico
                    if (cursor) cursor.classList.add('cli-hover');
                    if (follower) follower.classList.add('cli-hover');
                });
                terminalArea.addEventListener('mouseleave', () => {
                    // Remove a classe para voltar ao cursor padrão
                    if (cursor) cursor.classList.remove('cli-hover');
                    if (follower) follower.classList.remove('cli-hover');
                });
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

        // Função para obter as cores do tema ativas no CSS para o canvas
        function getThemeCanvasColors() {
            const style = getComputedStyle(document.body);

            // Funções auxiliares para converter strings de RGB para números
            const getRgbValue = (prop) => {
                const rgbString = style.getPropertyValue(prop).trim();
                // Remove o "rgb(" ou "rgba(" e ")", depois divide por vírgulas
                const parts = rgbString.replace(/rgba?\(|\)/g, '').split(',');
                return parts.slice(0, 3).map(Number); // Pega apenas os 3 primeiros (R, G, B)
            };

            return {
                gradientColor1: getRgbValue('--canvas-gradient-color1'),
                gradientOpacity1: parseFloat(style.getPropertyValue('--canvas-gradient-opacity1')),
                gradientColor2: getRgbValue('--canvas-gradient-color2'),
                gradientOpacity2: parseFloat(style.getPropertyValue('--canvas-gradient-opacity2')),
                gradientColor3: getRgbValue('--canvas-gradient-color3'),
                gradientOpacity3: parseFloat(style.getPropertyValue('--canvas-gradient-opacity3')),

                lineBaseHue: parseFloat(style.getPropertyValue('--canvas-line-base-hue')),
                lineHueRange: parseFloat(style.getPropertyValue('--canvas-line-hue-range')),

                trailColor: getRgbValue('--canvas-trail-color'),
                trailOpacity: parseFloat(style.getPropertyValue('--canvas-trail-opacity'))
            };
        }

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            createGradient();
            initializeLines();
        }

        // REFACTOR: Gradiente com opacidade reduzida para um fundo mais escuro
        function createGradient() {
            const colors = getThemeCanvasColors();
            gradient = ctx.createLinearGradient(canvas.width, 0, 0, 0);
            gradient.addColorStop(0, `rgba(${colors.gradientColor1.join(',')}, ${colors.gradientOpacity1})`);
            gradient.addColorStop(0.5, `rgba(${colors.gradientColor2.join(',')}, ${colors.gradientOpacity2})`);
            gradient.addColorStop(1, `rgba(${colors.gradientColor3.join(',')}, ${colors.gradientOpacity3})`);
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
                const colors = getThemeCanvasColors(); // Pega as cores mais recentes ao desenhar
                const length = (22 - this.z) * 5 + 10;
                const opacity = (22 - this.z) / 80;
                // Usa as variáveis CSS para definir o matiz das linhas
                const hue = colors.lineBaseHue + (this.x / canvas.width) * colors.lineHueRange;
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
            const colors = getThemeCanvasColors(); // Pega as cores mais recentes para o rastro

            // REFACTOR: Efeito de rastro mais transparente para escurecer o fundo
            ctx.fillStyle = `rgba(${colors.trailColor.join(',')}, ${colors.trailOpacity})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = gradient; // O gradiente é recriado no resizeCanvas
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            lines.forEach(line => {
                line.update();
                line.draw(); // A cor da linha é lida dentro do draw para maior dinamismo
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

            // Listener para mudanças de tema (ou qualquer mudança na classe do body)
            const body = document.body;
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        // Recria o gradiente e reinicializa as linhas quando o tema muda
                        createGradient();
                        initializeLines();
                    }
                });
            });
            observer.observe(body, { attributes: true });


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
        }

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
    // =============================================
    // MÓDULO DE ANIMAÇÃO EXCLUSIVO PARA A IMAGEM (CORRIGIDO)
    // =============================================
    const imageAnimationModule = (() => {
        let imageWrapper;
        const smoothingFactor = 0.02;
        let animationFrameId;

        function smoothAnimate() {
            if (!imageWrapper) return;
            let deltaX = imageWrapper.targetX - imageWrapper.currentX;
            let deltaOpacity = imageWrapper.targetOpacity - imageWrapper.currentOpacity;
            imageWrapper.currentX += deltaX * smoothingFactor;
            imageWrapper.currentOpacity += deltaOpacity * smoothingFactor;
            imageWrapper.style.transform = `translateX(${imageWrapper.currentX}%)`;
            imageWrapper.style.opacity = imageWrapper.currentOpacity;
            animationFrameId = requestAnimationFrame(smoothAnimate);
        }

        function init() {
            imageWrapper = document.querySelector('.image-to-animate');
            if (!imageWrapper) return;

            imageWrapper.targetX = 100;
            imageWrapper.currentX = 100;
            imageWrapper.targetOpacity = 0;
            imageWrapper.currentOpacity = 0;
            imageWrapper.style.opacity = '0';
            imageWrapper.style.willChange = 'transform, opacity';

            // -> CORREÇÃO: Usando rootMargin para criar a "zona neutra"
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Aparece quando entra na tela
                        imageWrapper.targetX = 0;
                        imageWrapper.targetOpacity = 1;
                    } else {
                        // Só desaparece depois de sair completamente da tela
                        imageWrapper.targetX = 100;
                        imageWrapper.targetOpacity = 0;
                    }
                });
            }, {
                // O gatilho é uma margem invisível de 20% na parte inferior e superior
                rootMargin: "0px 0px -20% 0px"
            });

            observer.observe(imageWrapper);

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            smoothAnimate();
        }
        return { init };
    })();

    // =============================================
    // MÓDULO "SLIDE-UP" SUAVE PARA CONTEÚDO (CORRIGIDO)
    // =============================================
    const contentAnimationModule = (() => {
        let elements;
        const smoothingFactor = 0.02;
        let animationFrameId;

        function smoothAnimate() {
            if (!elements || elements.length === 0) return;
            elements.forEach(el => {
                let deltaY = el.targetY - el.currentY;
                let deltaOpacity = el.targetOpacity - el.currentOpacity;
                el.currentY += deltaY * smoothingFactor;
                el.currentOpacity += deltaOpacity * smoothingFactor;
                if (Math.abs(deltaY) < 0.01) el.currentY = el.targetY;
                if (Math.abs(deltaOpacity) < 0.01) el.currentOpacity = el.targetOpacity;
                el.style.transform = `translateY(${el.currentY}px)`;
                el.style.opacity = el.currentOpacity;
            });
            animationFrameId = requestAnimationFrame(smoothAnimate);
        }

        function init() {
            elements = document.querySelectorAll('.smooth-slide-up');
            if (!elements || elements.length === 0) return;

            elements.forEach(el => {
                el.targetY = 80;
                el.currentY = 80;
                el.targetOpacity = 0;
                el.currentOpacity = 0;
                el.style.opacity = '0';
                el.style.willChange = 'transform, opacity';
            });

            // -> CORREÇÃO: Usando rootMargin para criar a "zona neutra"
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const el = entry.target;
                    if (entry.isIntersecting) {
                        // Aparece
                        el.targetY = 0;
                        el.targetOpacity = 1;
                    } else {
                        // Desaparece
                        el.targetY = 80;
                        el.targetOpacity = 0;
                    }
                });
            }, {
                // O gatilho é uma margem invisível de 20% na parte inferior
                rootMargin: "0px 0px -20% 0px"
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
    // MÓDULO DA TIMELINE ("DATA SHARD" - CORRIGIDO)
    // =============================================
    const timelineModule = (() => {
        function init() {
            const datascape = document.querySelector('.timeline-datascape');
            const spine = document.querySelector('.timeline-spine');
            const shards = document.querySelectorAll('.shard');
            if (!datascape || !spine || shards.length === 0) return;

            spine.innerHTML = '';
            document.querySelectorAll('.timeline-year').forEach(el => el.remove());
            const markers = [];
            const yearDisplays = [];

            shards.forEach((shard, index) => {
                const marker = document.createElement('div');
                marker.className = 'spine-marker';
                const shardTop = shard.offsetTop;
                marker.style.top = `${shardTop + 25}px`;
                spine.appendChild(marker);
                markers.push(marker);

                const yearDisplay = document.createElement('div');
                yearDisplay.className = 'timeline-year';
                yearDisplay.textContent = shard.dataset.year;
                yearDisplay.style.top = marker.style.top;
                if ((index + 1) % 2 !== 0) {
                    yearDisplay.classList.add('year-on-right');
                } else {
                    yearDisplay.classList.add('year-on-left');
                }
                datascape.appendChild(yearDisplay);
                yearDisplays.push(yearDisplay);
            });

            // -> CORREÇÃO: Usando rootMargin para criar a "zona neutra"
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const shard = entry.target;
                    const shardIndex = Array.from(shards).indexOf(shard);
                    const marker = markers[shardIndex];
                    const yearDisplay = yearDisplays[shardIndex];

                    // A classe só é ADICIONADA se o elemento está visível
                    if (entry.isIntersecting) {
                        shard.classList.add('is-visible');
                        if (marker) marker.classList.add('is-active');
                        if (yearDisplay) yearDisplay.classList.add('is-visible');
                    } else {
                        // A classe só é REMOVIDA se o elemento está fora da tela
                        shard.classList.remove('is-visible');
                        if (marker) marker.classList.remove('is-active');
                        if (yearDisplay) yearDisplay.classList.remove('is-visible');
                    }
                });
            }, {
                // O gatilho acontece quando o elemento está 25% para dentro da parte de baixo
                // E 25% para dentro da parte de cima. Isso cria a zona neutra.
                rootMargin: "-25% 0px -25% 0px"
            });

            shards.forEach(shard => {
                observer.observe(shard);
            });
        }
        return { init };
    })();

    // =============================================
    // MÓDULO DE FERRAMENTAS INTERATIVO (CORRIGIDO)
    // =============================================
    const toolsModule = (() => {
        let toolCards, nameDisplay, descDisplay, descPanel;
        let activeTool = null; // Variável para "lembrar" o card clicado

        // Função centralizada para atualizar o painel de descrição
        function updatePanel(card) {
            // Se nenhum card for passado (ou seja, activeTool é null), mostra a mensagem padrão
            if (!card) {
                nameDisplay.textContent = 'Selecione uma Ferramenta';
                descDisplay.textContent = 'Passe o mouse ou clique em um ícone para ver os detalhes da tecnologia.';
                return;
            }

            const name = card.dataset.toolName;
            const description = card.dataset.toolDescription;

            // Efeito de fade para a troca de texto
            descPanel.classList.add('fading');
            setTimeout(() => {
                nameDisplay.textContent = name;
                descDisplay.textContent = description;
                descPanel.classList.remove('fading');
            }, 150);
        }

        function init() {
            toolCards = document.querySelectorAll('.tool-card');
            nameDisplay = document.getElementById('tool-name-display');
            descDisplay = document.getElementById('tool-desc-display');
            descPanel = document.querySelector('.tool-description-panel');

            if (toolCards.length === 0 || !nameDisplay || !descDisplay) return;

            toolCards.forEach(card => {
                // Evento de CLICK: Define o card como "ativo"
                card.addEventListener('click', () => {
                    if (activeTool) {
                        activeTool.classList.remove('active');
                    }
                    activeTool = card;
                    activeTool.classList.add('active');
                    updatePanel(activeTool);
                });

                // Evento de MOUSEENTER: Mostra a descrição temporariamente
                card.addEventListener('mouseenter', () => {
                    updatePanel(card);
                });

                // Evento de MOUSELEAVE: Volta para a descrição do card "ativo"
                card.addEventListener('mouseleave', () => {
                    updatePanel(activeTool);
                });
            });

            // -> CORREÇÃO AQUI:
            // O bloco que selecionava o primeiro item foi removido.
            // Agora, chamamos a função updatePanel com o valor inicial de activeTool (que é null),
            // garantindo que a mensagem padrão seja exibida ao carregar a página.
            updatePanel(activeTool);
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
    // MÓDULO DO SELETOR DE TEMA
    // =============================================
    const themeSwitcherModule = (() => {
        const themeToggleBtn = document.getElementById('theme-toggle');
        const body = document.body;
        const icon = themeToggleBtn ? themeToggleBtn.querySelector('i') : null;

        // Função para aplicar o tema salvo ou o padrão
        function applyTheme(theme) {
            if (theme === 'theme-light') {
                body.classList.add('theme-light');
                if (icon) icon.className = 'ph-light ph-moon'; // Ícone de lua para tema claro
            } else {
                body.classList.remove('theme-light');
                if (icon) icon.className = 'ph-light ph-sun'; // Ícone de sol para tema escuro
            }
            localStorage.setItem('portfolioTheme', theme); // Salva a preferência do usuário
        }

        // Função para alternar o tema
        function toggleTheme() {
            if (body.classList.contains('theme-light')) {
                applyTheme('theme-dark');
            } else {
                applyTheme('theme-light');
            }
        }

        function init() {
            if (!themeToggleBtn) {
                console.warn('Módulo de Seletor de Tema: Botão de alternância de tema não encontrado.');
                return;
            }

            // Carrega o tema salvo do localStorage ao iniciar
            const savedTheme = localStorage.getItem('portfolioTheme');
            if (savedTheme) {
                applyTheme(savedTheme);
            } else {
                // Aplica o tema padrão se não houver um salvo (ex: dark por padrão)
                applyTheme('theme-dark');
            }

            themeToggleBtn.addEventListener('click', toggleTheme);
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
    themeSwitcherModule.init();
});