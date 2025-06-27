'use strict';

document.addEventListener('DOMContentLoaded', function () {

    // --- PASO 1: CONFIGURACIÓN DE FIREBASE ---
    // ¡PEGA AQUÍ LA CONFIGURACIÓN QUE COPIASTE DE FIREBASE!
      const firebaseConfig = {
        apiKey: "AIzaSyB0ouC6qbpqNtGdgii8Akwdo-zKOozVLSQ",
        authDomain: "derby-bet-mundial-clubs.firebaseapp.com",
        projectId: "derby-bet-mundial-clubs",
        storageBucket: "derby-bet-mundial-clubs.firebasestorage.app",
        messagingSenderId: "946168774643",
        appId: "1:946168774643:web:1f310f176e127739a21c86"
      };

    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore(); // Objeto para interactuar con la base de datos

    // --- CONFIGURACIÓN DE PARTIDOS ---
    const partidos = [
        { teamA: "Palmeiras", teamB: "Botafogo" },
        { teamA: "Benfica", teamB: "Chelsea" },
        { teamA: "PSG", teamB: "Inter Miami" },
        { teamA: "Flamengo", teamB: "FC Bayern" },
        { teamA: "Inter de Milán", teamB: "Fluminense" },
        { teamA: "Manchester City", teamB: "Al Hilal" },
        { teamA: "Real Madrid", teamB: "Juventus" },
        { teamA: "Dortmound", teamB: "Monterrey" }
    ];

    // --- GENERACIÓN DINÁMICA DE LA PÁGINA ---
    const matchesContainer = document.getElementById('matches-container');
    partidos.forEach((partido, index) => {
        const matchHTML = `
            <div class="match">
                <span class="team-name team-a">${partido.teamA}</span>
                <input type="number" class="score" id="scoreA${index}" min="0" max="99" aria-label="Goles ${partido.teamA}">
                <span class="vs">-</span>
                <input type="number" class="score" id="scoreB${index}" min="0" max="99" aria-label="Goles ${partido.teamB}">
                <span class="team-name team-b">${partido.teamB}</span>
            </div>
        `;
        matchesContainer.innerHTML += matchHTML;
    });

    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    const submitBtn = document.getElementById('submitBtn');
    const userNameInput = document.getElementById('userName');
    const resultsContainer = document.getElementById('results-container');

    // --- FUNCIONALIDAD CON FIREBASE ---

    // **GUARDAR** pronósticos en la nube
    submitBtn.addEventListener('click', function () {
        const userName = userNameInput.value.trim();
        if (!userName) {
            alert('Por favor, escribe tu nombre antes de guardar.');
            return;
        }

        const pronosticos = {
            usuario: userName,
            fecha: firebase.firestore.FieldValue.serverTimestamp(), // Usa la hora del servidor
            predicciones: []
        };

        let allScoresFilled = true;
        partidos.forEach((partido, index) => {
            const scoreA = document.getElementById(`scoreA${index}`).value;
            const scoreB = document.getElementById(`scoreB${index}`).value;
            if (scoreA === '' || scoreB === '') allScoresFilled = false;
            pronosticos.predicciones.push({
                equipoA: partido.teamA, golesA: scoreA,
                equipoB: partido.teamB, golesB: scoreB
            });
        });

        if (!allScoresFilled) {
            alert('Debes rellenar todos los marcadores.');
            return;
        }

        // Añade un nuevo documento a la colección "pronosticos"
        db.collection("pronosticos").add(pronosticos)
            .then((docRef) => {
                alert(`¡Gracias ${userName}! Tus pronósticos se guardaron en la nube.`);
            })
            .catch((error) => {
                console.error("Error al guardar: ", error);
                alert("Hubo un error al guardar. Revisa la consola para más detalles.");
            });
    });

    // **LEER Y MOSTRAR** los pronósticos en tiempo real
    function mostrarPronosticosEnTiempoReal() {
        // Esta función se activa una vez y luego cada vez que hay un cambio en la base de datos
        db.collection("pronosticos").orderBy("fecha", "desc").onSnapshot((querySnapshot) => {
            resultsContainer.innerHTML = '<h2>Pronósticos de Todos los Participantes:</h2>';

            if (querySnapshot.empty) {
                resultsContainer.innerHTML += "<p>Nadie ha enviado un pronóstico todavía. ¡Sé el primero!</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                let html = `
                    <div class="prediction-card">
                        <p class="user-name"><strong>${data.usuario}</strong></p>
                        <ul>
                `;
                data.predicciones.forEach(p => {
                    html += `<li>${p.equipoA} <strong>${p.golesA || '0'} - ${p.golesB || '0'}</strong> ${p.equipoB}</li>`;
                });
                html += `</ul></div>`;
                resultsContainer.innerHTML += html;
            });
        });
    }

    // Finalmente, llama a la función para que empiece a "escuchar" los cambios
    mostrarPronosticosEnTiempoReal();
});
