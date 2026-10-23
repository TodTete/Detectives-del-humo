import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { addDays, today } from '../lib/dates'
import { ProfileForm } from '../features/adults/components/ProfileForm'
import { BarChart } from './BarChart'
import { ChoiceGroup } from './ChoiceGroup'
import { Field } from './Field'

describe('ChoiceGroup', () => {
  it('es un grupo de radios con leyenda y error asociado', async () => {
    const onChange = vi.fn()
    render(
      <ChoiceGroup
        legend="¿Qué prefieres?"
        name="x"
        value={null}
        onChange={onChange}
        error="Elige una opción."
        options={[
          { value: 'a', label: 'Opción A' },
          { value: 'b', label: 'Opción B' },
        ]}
      />,
    )
    const group = screen.getByRole('group', { name: '¿Qué prefieres?' })
    expect(group).toHaveAccessibleDescription('Elige una opción.')
    await userEvent.click(within(group).getByRole('radio', { name: 'Opción B' }))
    expect(onChange).toHaveBeenCalledWith('b')
  })
})

describe('Field', () => {
  it('vincula etiqueta, ayuda y error con el control', () => {
    render(
      <Field label="Nombre" hint="Como aparece en la escuela." error="Es obligatorio.">
        {(props) => <input {...props} />}
      </Field>,
    )
    const input = screen.getByLabelText('Nombre')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(/Como aparece en la escuela\..*Es obligatorio\./)
  })
})

describe('BarChart', () => {
  it('ofrece una tabla alternativa con los mismos datos', async () => {
    render(
      <BarChart
        title="Prueba"
        description="Datos de prueba"
        series={[{ key: 'v', label: 'Valor', className: 'bar--ink' }]}
        groups={[
          { label: 'Lunes', values: { v: 3 }, reference: 4 },
          { label: 'Martes', values: { v: null }, reference: 4 },
        ]}
        referenceLabel="Límite"
      />,
    )
    expect(screen.getByRole('img', { name: /Prueba/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Tabla/ }))
    const table = screen.getByRole('table')
    expect(within(table).getByRole('row', { name: /Lunes 3 4/ })).toBeInTheDocument()
    expect(within(table).getByText('Sin registro')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tabla/ })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('ProfileForm', () => {
  it('muestra errores accesibles y no envía datos inválidos', async () => {
    const onSubmit = vi.fn()
    render(<ProfileForm submitLabel="Crear mi plan" onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole('button', { name: 'Crear mi plan' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Revisa/)
    expect(screen.getByText('Elige qué consumes.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envía un perfil válido con los tipos correctos', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ProfileForm submitLabel="Crear mi plan" onSubmit={onSubmit} />)
    await user.click(screen.getByRole('radio', { name: 'Cigarros' }))
    await user.type(screen.getByLabelText('¿Cuántos cigarros fumas al día?'), '12')
    await user.type(screen.getByLabelText('¿Cuánto gastas a la semana?'), '500')
    await user.click(screen.getByRole('radio', { name: 'Más de 3 años' }))
    await user.click(screen.getByRole('checkbox', { name: 'Al despertar' }))
    await user.click(screen.getByRole('radio', { name: /Reducir primero/ }))
    await user.type(screen.getByLabelText('¿A cuántos cigarros al día quieres llegar?'), '4')
    await user.click(screen.getByRole('button', { name: 'Crear mi plan' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      product: 'cigarro',
      perDay: 12,
      weeklySpend: 500,
      duration: 'mas-3',
      triggers: ['despertar'],
      goal: 'reducir',
      targetPerDay: 4,
      targetDate: addDays(today(), 28),
    })
  })
})
