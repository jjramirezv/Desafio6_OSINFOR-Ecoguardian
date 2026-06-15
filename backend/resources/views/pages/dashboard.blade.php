<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoGuardian - OSINFOR</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;700&display=swap" rel="stylesheet">
    
    <link href="{{ asset('css/estilos.css') }}" rel="stylesheet">
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