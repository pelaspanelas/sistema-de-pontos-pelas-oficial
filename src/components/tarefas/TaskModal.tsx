import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TaskForm } from './TaskForm'
import { InformativoForm } from './InformativoForm'
import { Task, Employee } from './types'
import { useToast } from '@/hooks/use-toast'
import { createTarefa, updateTarefa, createInformativo } from '@/services/tarefas'

interface TaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskToEdit?: Task | null
  employees: Employee[]
  onSuccess: () => void
}

export function TaskModal({
  open,
  onOpenChange,
  taskToEdit,
  employees,
  onSuccess,
}: TaskModalProps) {
  const [tab, setTab] = useState('tarefa')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setTab('tarefa')
    }
  }, [open, taskToEdit])

  const handleSaveTask = async (data: any) => {
    setIsLoading(true)
    try {
      if (taskToEdit) {
        const { error } = await updateTarefa(taskToEdit.id, data)
        if (error) throw error
        toast({ title: 'Tarefa atualizada com sucesso' })
      } else {
        const { error } = await createTarefa(data)
        if (error) throw error
        toast({ title: 'Tarefa criada com sucesso' })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({ title: 'Erro ao salvar tarefa', description: error.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveInformativo = async (data: any) => {
    setIsLoading(true)
    try {
      const { error } = await createInformativo(data)
      if (error) throw error
      toast({ title: 'Informativo enviado com sucesso' })
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar informativo',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !isLoading && onOpenChange(val)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? 'Editar Tarefa' : 'Nova Solicitação'}</DialogTitle>
        </DialogHeader>

        {!taskToEdit ? (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tarefa" disabled={isLoading}>
                Tarefa
              </TabsTrigger>
              <TabsTrigger value="informativo" disabled={isLoading}>
                Informativo
              </TabsTrigger>
            </TabsList>
            <TabsContent value="tarefa" className="mt-4">
              <TaskForm
                employees={employees}
                onSubmit={handleSaveTask}
                onCancel={() => onOpenChange(false)}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="informativo" className="mt-4">
              <InformativoForm
                employees={employees}
                onSubmit={handleSaveInformativo}
                onCancel={() => onOpenChange(false)}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="mt-4">
            <TaskForm
              initialData={taskToEdit}
              employees={employees}
              onSubmit={handleSaveTask}
              onCancel={() => onOpenChange(false)}
              isLoading={isLoading}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
