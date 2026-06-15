<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PageController extends Controller
{
    public function dashboard() {
        return view('pages.dashboard');
    }

    public function conector() {
        return view('pages.conector');
    }

    public function mapaOrigen() {
        return view('pages.mapa-origen');
    }

    public function explorador() {
        return view('pages.explorador');
    }

    public function huellas() {
        return view('pages.huellas');
    }

    public function alertas() {
        return view('pages.alertas');
    }

    public function integridad() {
        return view('pages.integridad');
    }
}