# Piedra, Papel o Tijera - Multiplayer

Un juego multiplayer en tiempo real de Piedra, Papel o Tijera utilizando Node.js, Express y Socket.IO.

## Características

- ✅ **Multiplayer en tiempo real** - Juega con otros jugadores conectados
- ✅ **Matchmaking automático** - Sistema de emparejamiento instantáneo
- ✅ **Interfaz moderna** - Diseño responsive y atractivo
- ✅ **Conexión en vivo** - Indicador de estado de conexión
- ✅ **Rejugable** - Opción de jugar de nuevo o buscar nuevo oponente

## Tecnologías Utilizadas

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Comunicación**: WebSockets (Socket.IO)

## Instalación

1. Clona o descarga este repositorio
2. Instala las dependencias:
```bash
npm install
```

## Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor se iniciará en `http://localhost:3000`

## Cómo Jugar

1. Abre `http://localhost:3000` en tu navegador
2. Haz clic en "Buscar Partida"
3. Espera a que se encuentre un oponente
4. Elige entre Piedra (✊), Papel (✋) o Tijera (✌️)
5. espera el resultado
6. Puedes jugar de nuevo o buscar un nuevo oponente

## Reglas del Juego

- ✊ Piedra vence a Tijera
- ✋ Papel vence a Piedra  
- ✌️ Tijera vence a Papel

## Arquitectura

### Backend (server.js)
- Servidor Express con Socket.IO
- Sistema de salas para manejar múltiples partidas
- Lógica de matchmaking automático
- Gestión de conexiones y desconexiones

### Frontend (public/)
- **index.html**: Estructura principal del juego
- **style.css**: Estilos modernos y responsive
- **script.js**: Lógica del cliente y manejo de Socket.IO

## Características Técnicas

- **WebSockets**: Comunicación bidireccional en tiempo real
- **Sistema de salas**: Manejo de múltiples partidas simultáneas
- **Gestión de estado**: Seguimiento de elecciones y resultados
- **Desconexión automática**: Manejo elegante de desconexiones

## Para Jugar en Multiplayer

1. Abre el juego en múltiples pestañas del navegador
2. O abre el juego en diferentes dispositivos en la misma red
3. Cada jugador debe hacer clic en "Buscar Partida"
4. El sistema emparejará automáticamente a los jugadores

## Personalización

Puedes personalizar fácilmente:
- Colores y estilos en `style.css`
- Animaciones y transiciones
- Reglas del juego
- Lógica de matchmaking

## Contribuciones

¡Las contribuciones son bienvenidas! Siéntete libre de:
- Reportar bugs
- Sugerir nuevas características
- Mejorar la documentación
- Optimizar el código

## Licencia

MIT License
