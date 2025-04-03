// 宠物模型相关代码
let scene, camera, renderer, pet;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

function initPet() {
    console.log('Initializing pet...');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('pet-canvas'),
        alpha: true 
    });
    renderer.setSize(200, 200);
    
    // 添加环境光和平行光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // 设置相机位置
    camera.position.z = 5;
    
    // 加载宠物模型
    const loader = new THREE.GLTFLoader();
    const modelPath = '../pet.glb';
    console.log('Loading model from:', modelPath);
    
    loader.load(
        modelPath,
        function (gltf) {
            console.log('Model loaded successfully');
            pet = gltf.scene;
            scene.add(pet);
            
            // 调整模型大小和位置
            pet.scale.set(0.5, 0.5, 0.5);
            pet.position.set(0, 0, 0);
            
            // 开始动画循环
            animate();
        },
        function (xhr) {
            console.log('Loading progress:', (xhr.loaded / xhr.total * 100) + '%');
        },
        function (error) {
            console.error('Error loading model:', error);
            // 添加错误提示到对话框
            const dialog = document.getElementById('pet-dialog');
            if (dialog) {
                dialog.querySelector('.dialog-content').textContent = '抱歉，宠物模型加载失败，请刷新页面重试。';
                dialog.classList.add('show');
            }
        }
    );
    
    // 添加鼠标事件监听
    const container = document.getElementById('pet-container');
    if (container) {
        container.addEventListener('mousedown', onMouseDown);
        container.addEventListener('mousemove', onMouseMove);
        container.addEventListener('mouseup', onMouseUp);
        container.addEventListener('click', toggleDialog);
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    if (pet) {
        pet.rotation.y += 0.005;
    }
    
    renderer.render(scene, camera);
}

function onMouseDown(event) {
    isDragging = true;
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
}

function onMouseMove(event) {
    if (!isDragging) return;
    
    const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
    };
    
    if (pet) {
        pet.rotation.y += deltaMove.x * 0.01;
    }
    
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
}

function onMouseUp() {
    isDragging = false;
}

function toggleDialog() {
    const dialog = document.getElementById('pet-dialog');
    if (dialog) {
        dialog.classList.toggle('show');
    }
}

// 初始化宠物
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing pet...');
    initPet();
    
    // 添加对话框关闭按钮的事件监听
    const closeButton = document.querySelector('.dialog-close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            const dialog = document.getElementById('pet-dialog');
            if (dialog) {
                dialog.classList.remove('show');
            }
        });
    }
}); 