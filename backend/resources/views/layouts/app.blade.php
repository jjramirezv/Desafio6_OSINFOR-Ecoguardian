<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoGuardian - OSINFOR</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;700&display=swap" rel="stylesheet">
    
    <style>
        /* Variables Oficiales OSINFOR */
        :root {
            --verde-principal: #007D48;
            --verde-secundario: #4EB369;
            --turquesa: #00A1A1;
            --amarillo: #FFC32A;
            --naranja: #F97A53;
            --marron: #93604A;
            --fondo-app: #F4F7F6;
            --fondo-panel: #FFFFFF;
            --texto-principal: #333333;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Barlow', sans-serif;
            background-color: var(--fondo-app);
            color: var(--texto-principal);
            display: flex;
            min-height: 100vh;
        }

        h1, h2, h3 { color: var(--verde-principal); margin-bottom: 1rem; }

        /* Menú Lateral */
        aside {
            width: 250px;
            background-color: var(--verde-principal);
            color: white;
            padding: 2rem 1.5rem;
            position: sticky;
            top: 0;
            height: 100vh;
        }

        aside nav header strong {
            font-size: 1.5rem;
            display: block;
            margin-bottom: 2rem;
            color: white;
        }

        aside nav ul { list-style: none; }
        aside nav ul li { margin-bottom: 1rem; }
        aside nav ul li a {
            color: white;
            text-decoration: none;
            font-weight: 500;
            display: block;
            padding: 0.8rem;
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        aside nav ul li a:hover { background-color: var(--verde-secundario); }

        /* Contenido Principal */
        main {
            flex: 1;
            padding: 2rem 3rem;
            overflow-y: auto;
        }

        /* Tarjetas del Dashboard */
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }

        article.card {
            background-color: var(--fondo-panel);
            padding: 1.5rem;
            border-radius: 8px;
            border-left: 5px solid var(--verde-secundario);
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        article.card strong { color: var(--turquesa); font-size: 1.2rem; }
    </style>
</head>
<body>

    <aside>
        <nav>
            <header>
                <strong>EcoGuardian</strong>
            </header>
            <ul>
                <li><a href="{{ route('dashboard') }}">Dashboard</a></li>
                <li><a href="{{ route('conector') }}">Conector</a></li>
                <li><a href="{{ route('mapa-origen') }}">Mapa de Origen</a></li>
                <li><a href="{{ route('explorador') }}">Explorador</a></li>
                <li><a href="{{ route('huellas') }}">Huellas Legales</a></li>
                <li><a href="{{ route('alertas') }}">Alertas</a></li>
                <li><a href="{{ route('integridad') }}">Integridad</a></li>
            </ul>
        </nav>
    </aside>

    <main>
        @yield('content')
    </main>

</body>
</html>