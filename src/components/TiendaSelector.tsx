import React, { useEffect, useState } from 'react';
import { Select, MenuItem, FormControl, SelectChangeEvent } from '@mui/material';

interface Tienda {
  id: number;
  nombre: string;
}

interface TiendaSelectorProps {
  onTiendaSeleccionada: (idTienda: number) => void;
}

const TiendaSelector: React.FC<TiendaSelectorProps> = ({ onTiendaSeleccionada }) => {
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState<number>(1);

  useEffect(() => {
    // Simular tiendas para pruebas
    const mockTiendas = [
      { id: 1, nombre: 'Tienda Demo 1' },
      { id: 2, nombre: 'Tienda Demo 2' },
    ];
    setTiendas(mockTiendas);
    // Notificar la tienda por defecto
    onTiendaSeleccionada(1);
  }, []);

  const handleChange = (event: SelectChangeEvent<number>) => {
    const selectedId = Number(event.target.value);
    setTiendaSeleccionada(selectedId);
    onTiendaSeleccionada(selectedId); // Notificar al componente padre
  };

  return (
    <FormControl fullWidth>
      <Select
        labelId="tienda-label"
        value={tiendaSeleccionada}
        onChange={handleChange}
      >
        {tiendas.map(tienda => (
          <MenuItem key={tienda.id} value={tienda.id}>
            {tienda.nombre}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TiendaSelector;