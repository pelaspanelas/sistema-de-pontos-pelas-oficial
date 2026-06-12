interface Launch {
  id: string
  descricao: string
  categoria: 'credito' | 'debito'
  valor: number
}

interface Profile {
  id: string
  name: string
  role: string
  cpf: string
  base_salary: number
}

interface PaySlipPrintProps {
  profile: Profile
  launches: Launch[]
  monthName: string
  year: number
  totalCredits: number
  totalDebits: number
  netPay: number
  companyLogoUrl?: string | null
}

export function PaySlipPrint({
  profile,
  launches,
  monthName,
  year,
  totalCredits,
  totalDebits,
  netPay,
  companyLogoUrl,
}: PaySlipPrintProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div
      className="w-full max-w-[210mm] mx-auto box-border h-[148mm] p-4 text-black font-sans bg-white relative"
      style={{ pageBreakInside: 'avoid' }}
    >
      <div className="border border-black p-3 mb-3">
        <div className="flex justify-between items-center border-b border-black pb-2 mb-2">
          <div className="flex items-center gap-4">
            {companyLogoUrl && (
              <img src={companyLogoUrl} alt="Logo" className="max-h-12 object-contain" />
            )}
            <div>
              <h1 className="text-lg font-bold uppercase tracking-tight">Pelas Panelas</h1>
              <p className="text-[10px]">CNPJ: 00.000.000/0001-00</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold uppercase">Recibo de Pagamento de Salário</h2>
            <p className="font-semibold text-xs">
              Mês/Ano: {monthName} / {year}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2 text-[10px]">
          <div className="col-span-2">
            <p className="text-gray-600 text-[9px]">Código</p>
            <p className="font-bold">{profile.id.substring(0, 8)}</p>
          </div>
          <div className="col-span-5">
            <p className="text-gray-600 text-[9px]">Nome do Funcionário</p>
            <p className="font-bold truncate">{profile.name}</p>
          </div>
          <div className="col-span-3">
            <p className="text-gray-600 text-[9px]">Função</p>
            <p className="font-bold truncate">{profile.role || 'Não informada'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-600 text-[9px]">CPF</p>
            <p className="font-bold">{profile.cpf || 'Não informado'}</p>
          </div>
        </div>
      </div>

      <table className="w-full border-collapse border border-black mb-3 text-[10px]">
        <thead>
          <tr>
            <th className="border-b border-black border-r py-1 px-2 text-left w-12">Cód</th>
            <th className="border-b border-black border-r py-1 px-2 text-left">Descrição</th>
            <th className="border-b border-black border-r py-1 px-2 text-right w-24">
              Vencimentos
            </th>
            <th className="border-b border-black py-1 px-2 text-right w-24">Descontos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-r border-black py-0.5 px-2">001</td>
            <td className="border-r border-black py-0.5 px-2">Salário Base</td>
            <td className="border-r border-black py-0.5 px-2 text-right">
              {formatCurrency(profile.base_salary || 0)}
            </td>
            <td className="py-0.5 px-2 text-right"></td>
          </tr>
          {launches.map((l, idx) => (
            <tr key={l.id}>
              <td className="border-r border-black py-0.5 px-2">
                {(idx + 2).toString().padStart(3, '0')}
              </td>
              <td className="border-r border-black py-0.5 px-2 truncate max-w-[200px]">
                {l.descricao}
              </td>
              <td className="border-r border-black py-0.5 px-2 text-right">
                {l.categoria === 'credito' ? formatCurrency(l.valor) : ''}
              </td>
              <td className="py-0.5 px-2 text-right">
                {l.categoria === 'debito' ? formatCurrency(l.valor) : ''}
              </td>
            </tr>
          ))}
          {Array.from({ length: Math.max(0, 10 - launches.length) }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border-r border-black py-0.5 px-2 h-4"></td>
              <td className="border-r border-black py-0.5 px-2"></td>
              <td className="border-r border-black py-0.5 px-2"></td>
              <td className="py-0.5 px-2"></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border border-black flex">
        <div className="w-1/2 p-2 text-[9px] border-r border-black flex flex-col justify-between">
          <p>DECLARO TER RECEBIDO A IMPORTÂNCIA LÍQUIDA DISCRIMINADA NESTE RECIBO.</p>
          <div className="mt-8 text-center flex flex-col items-center">
            <div className="w-3/4 border-t border-black mb-1"></div>
            <p>Assinatura do Funcionário</p>
            <p className="mt-1">Data: ___/___/_____</p>
          </div>
        </div>
        <div className="w-1/2 flex flex-col">
          <div className="flex border-b border-black flex-1">
            <div className="w-1/2 p-1.5 border-r border-black">
              <p className="text-gray-600 text-[9px] mb-0.5">Total de Vencimentos</p>
              <p className="font-bold text-right text-[10px]">
                {formatCurrency((profile.base_salary || 0) + totalCredits)}
              </p>
            </div>
            <div className="w-1/2 p-1.5">
              <p className="text-gray-600 text-[9px] mb-0.5">Total de Descontos</p>
              <p className="font-bold text-right text-[10px]">{formatCurrency(totalDebits)}</p>
            </div>
          </div>
          <div className="p-2 flex justify-between items-center bg-gray-50">
            <p className="font-bold text-[10px]">Valor Líquido:</p>
            <p className="font-bold text-sm">{formatCurrency(netPay)}</p>
          </div>
        </div>
      </div>
      <div className="w-full border-t border-dashed border-gray-400 absolute bottom-0 left-0"></div>
    </div>
  )
}
