import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TaskForm } from './TaskForm'
import { InformativoForm } from './InformativoForm'
import { Task, EMPLOYEES } from './types'
import { useToast } from '@/hooks/use-toast'

interface TaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskToEdit?: Task | null
  onSaveTask: (task: Task) => void
}

export function TaskModal({ open, onOpenChange, taskToEdit, onSaveTask }: TaskModalProps) {
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
      // Mock network request
      await new Promise((resolve) => setTimeout(resolve, 600))

      const responsibleName = EMPLOYEES.find((e) => e.id === data.responsibleId)?.name || ''
      const newTask: Task = {
        ...data,
        id: taskToEdit?.id || Math.random().toString(36).substring(7),
        responsibleName,
      }

      onSaveTask(newTask)
      toast({ title: taskToEdit ? 'Tarefa atualizada com sucesso' : 'Tarefa criada com sucesso' })
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveInformativo = async (data: any) => {
    setIsLoading(true)
    try {
      // Mock network request
      await new Promise((resolve) => setTimeout(resolve, 600))

      toast({ title: 'Informativo enviado com sucesso' })
      onOpenChange(false)
    } catch (error) {
      toast({ title: 'Erro ao enviar', variant: 'destructive' })
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
                onSubmit={handleSaveTask}
                onCancel={() => onOpenChange(false)}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="informativo" className="mt-4">
              <InformativoForm
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
