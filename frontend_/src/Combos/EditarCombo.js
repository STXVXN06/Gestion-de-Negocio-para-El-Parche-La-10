import React from 'react';
import { useParams } from 'react-router-dom';

export default function EditarCombo() {
    const { id } = useParams();

    return (
        <div>
            <h1>Editar Combo ID: {id}</h1>
            {/* Aquí iría el formulario de edición */}
        </div>
    );
}