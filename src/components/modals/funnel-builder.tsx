"use client"

import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"
import { Input } from "@/src/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Label } from "@/src/components/ui/label"
import { Filter, Mail, Eye, MousePointer, Clock, X, AlertCircle } from "lucide-react"
import { IFunnel, IFunnelStep } from "@/src/common/@types/@email-campaign"

interface FunnelBuilderProps {
  onComplete: (funnel: IFunnel) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function FunnelBuilder({ onComplete, onCancel, isSubmitting }: FunnelBuilderProps) {
  // Estado para armazenar os passos do funil
  const [steps, setSteps] = useState<IFunnelStep[]>([
    {
      id: "initial-email",
      name: "Email Inicial",
      type: "email",
      content: {
        subject: "Será definido na etapa de criação de copy",
        body: "O conteúdo será definido na etapa de criação de copy",
      },
      children: [],
    },
  ])

  // Estado para armazenar o ID do passo raiz
  const [rootStepId, setRootStepId] = useState<string>("initial-email")

  // Estado para armazenar o passo que está sendo editado
  const [editingStepId, setEditingStepId] = useState<string | null>(null)

  // Função para adicionar um novo passo ao funil
  const addStep = (parentId: string, type: "email" | "condition" | "delay") => {
    const newStepId = `step-${Date.now()}`

    const newStep: IFunnelStep = {
      id: newStepId,
      name:
        type === "email"
          ? `Email ${steps.length + 1}`
          : type === "condition"
            ? `Condição ${steps.length + 1}`
            : `Atraso ${steps.length + 1}`,
      type,
      children: [],
    }

    if (type === "email") {
      newStep.content = {
        subject: "Será definido na etapa de criação de copy",
        body: "O conteúdo será definido na etapa de criação de copy",
      }
    } else if (type === "condition") {
      newStep.condition = {
        type: "opened",
      }
    } else if (type === "delay") {
      newStep.delay = {
        days: 1,
        hours: 0,
      }
    }

    // Adicionar o novo passo à lista de passos
    setSteps((prevSteps) => [...prevSteps, newStep])

    // Adicionar o ID do novo passo aos filhos do passo pai
    setSteps((prevSteps) =>
      prevSteps.map((step) => (step.id === parentId ? { ...step, children: [...step.children, newStepId] } : step)),
    )

    // Definir o novo passo como o passo que está sendo editado
    setEditingStepId(newStepId)
  }

  // Função para remover um passo do funil
  const removeStep = (stepId: string) => {
    // Encontrar o passo pai
    const parentStep = steps.find((step) => step.children.includes(stepId))

    if (parentStep) {
      // Remover o ID do passo dos filhos do passo pai
      setSteps((prevSteps) =>
        prevSteps.map((step) =>
          step.id === parentStep.id ? { ...step, children: step.children.filter((id) => id !== stepId) } : step,
        ),
      )
    }

    // Remover o passo e todos os seus filhos recursivamente
    const removeStepAndChildren = (id: string) => {
      const step = steps.find((s) => s.id === id)
      if (!step) return []

      const childrenIds = step.children
      const childrenToRemove = childrenIds.flatMap((childId) => removeStepAndChildren(childId))

      return [id, ...childrenToRemove]
    }

    const idsToRemove = removeStepAndChildren(stepId)

    // Atualizar a lista de passos
    setSteps((prevSteps) => prevSteps.filter((step) => !idsToRemove.includes(step.id)))

    // Se o passo que está sendo editado for removido, limpar o estado
    if (editingStepId === stepId) {
      setEditingStepId(null)
    }
  }

  // Função para atualizar um passo do funil
  const updateStep = (stepId: string, updates: Partial<IFunnelStep>) => {
    setSteps((prevSteps) => prevSteps.map((step) => (step.id === stepId ? { ...step, ...updates } : step)))
  }

  // Função para salvar o funil
  const saveFunnel = () => {
    const funnel: IFunnel = {
      steps,
      rootStepId,
    }

    onComplete(funnel)
  }

  // Renderizar um passo do funil
  const renderStep = (stepId: string, level = 0) => {
    const step = steps.find((s) => s.id === stepId)
    if (!step) return null

    return (
      <div key={step.id} className="mb-4" style={{ marginLeft: `${level * 24}px` }}>
        <div
          className={`
            p-3 rounded-md border-2 flex items-start gap-3
            ${editingStepId === step.id ? "border-emerald-500" : "border-gray-200"}
            ${step.type === "email" ? "bg-blue-50" : step.type === "condition" ? "bg-purple-50" : "bg-amber-50"}
          `}
        >
          {/* Ícone do passo */}
          <div className="mt-1">
            {step.type === "email" ? (
              <Mail className="h-5 w-5 text-blue-600" />
            ) : step.type === "condition" ? (
              step.condition?.type === "opened" ? (
                <Eye className="h-5 w-5 text-purple-600" />
              ) : (
                <MousePointer className="h-5 w-5 text-purple-600" />
              )
            ) : (
              <Clock className="h-5 w-5 text-amber-600" />
            )}
          </div>

          {/* Conteúdo do passo */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium">{step.name}</h3>
              {step.id !== "initial-email" && (
                <button type="button" className="text-gray-400 hover:text-red-500" onClick={() => removeStep(step.id)}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Detalhes do passo */}
            {step.type === "email" && (
              <div className="text-xs text-gray-600">
                <p className="flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
                  Conteúdo será definido na etapa de criação de copy
                </p>
              </div>
            )}

            {step.type === "condition" && step.condition && (
              <div className="text-xs text-gray-600">
                <p>
                  <strong>Condição:</strong> {step.condition.type === "opened" ? "Abriu o email" : "Clicou no link"}
                </p>
                {step.condition.target && (
                  <p>
                    <strong>Email alvo:</strong>{" "}
                    {steps.find((s) => s.id === step.condition?.target)?.name || "Não definido"}
                  </p>
                )}
              </div>
            )}

            {step.type === "delay" && step.delay && (
              <div className="text-xs text-gray-600">
                <p>
                  <strong>Atraso:</strong> {step.delay.days} dias e {step.delay.hours} horas
                </p>
              </div>
            )}

            {/* Botões de edição e adição */}
            <div className="mt-2 flex flex-wrap gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setEditingStepId(step.id)}
              >
                Editar
              </Button>

              {/* Botões para adicionar novos passos */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => addStep(step.id, "email")}
              >
                <Mail className="h-3 w-3 mr-1" />
                Email
              </Button>

              {step.type === "email" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => addStep(step.id, "condition")}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Condição
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => addStep(step.id, "delay")}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Atraso
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Renderizar os filhos do passo */}
        {step.children.length > 0 && (
          <div className="mt-2 pl-4 border-l-2 border-gray-200">
            {step.children.map((childId) => (
              <div key={childId} className="relative">
                <div className="absolute -left-4 top-4 w-4 h-0.5 bg-gray-200"></div>
                {renderStep(childId, level + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Renderizar o painel de edição
  const renderEditPanel = () => {
    if (!editingStepId) return null

    const step = steps.find((s) => s.id === editingStepId)
    if (!step) return null

    return (
      <div className="border-l border-gray-200 p-4 h-full overflow-y-auto">
        <h3 className="text-sm font-medium mb-3">
          Editar {step.type === "email" ? "Email" : step.type === "condition" ? "Condição" : "Atraso"}
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="step-name">Nome</Label>
            <Input
              id="step-name"
              value={step.name}
              onChange={(e) => updateStep(step.id, { name: e.target.value })}
              className="mt-1"
            />
          </div>

          {step.type === "email" && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-800">Conteúdo do email</p>
                  <p className="text-xs text-amber-700 mt-1">
                    O assunto e o conteúdo do email serão definidos na etapa de "Criação da Copy Principal".
                  </p>
                </div>
              </div>
            </div>
          )}

          {step.type === "condition" && step.condition && (
            <>
              <div>
                <Label htmlFor="condition-type">Tipo de Condição</Label>
                <Select
                  value={step.condition.type}
                  onValueChange={(value) =>
                    updateStep(step.id, { condition: { ...step.condition, type: value as "opened" | "clicked" } })
                  }
                >
                  <SelectTrigger id="condition-type" className="mt-1">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opened">Abriu o email</SelectItem>
                    <SelectItem value="clicked">Clicou no link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="condition-target">Email Alvo</Label>
                <Select
                  value={step.condition.target || ""}
                  onValueChange={(value) => updateStep(step.id, { condition: { ...step.condition, target: value } })}
                >
                  <SelectTrigger id="condition-target" className="mt-1">
                    <SelectValue placeholder="Selecione o email" />
                  </SelectTrigger>
                  <SelectContent>
                    {steps
                      .filter((s) => s.type === "email" && s.id !== step.id)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step.type === "delay" && step.delay && (
            <>
              <div>
                <Label htmlFor="delay-days">Dias</Label>
                <Input
                  id="delay-days"
                  type="number"
                  min="0"
                  value={step.delay.days}
                  onChange={(e) =>
                    updateStep(step.id, { delay: { ...step.delay, days: Number.parseInt(e.target.value) || 0 } })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="delay-hours">Horas</Label>
                <Input
                  id="delay-hours"
                  type="number"
                  min="0"
                  max="23"
                  value={step.delay.hours}
                  onChange={(e) =>
                    updateStep(step.id, { delay: { ...step.delay, hours: Number.parseInt(e.target.value) || 0 } })
                  }
                  className="mt-1"
                />
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <DialogHeader className="flex-shrink-0">
        <DialogTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Construtor de Funil de Email
        </DialogTitle>
        <p className="text-sm text-gray-500 mt-1">
          Crie um fluxo personalizado de emails baseado em condições como abertura e clique
        </p>
      </DialogHeader>

      <div className="py-4 flex flex-col flex-grow overflow-hidden">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 flex-shrink-0">
          <h4 className="text-sm font-medium text-blue-700 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
            Como criar seu funil
          </h4>
          <ul className="text-xs text-blue-600 mt-1 ml-5 list-disc">
            <li>Comece com o email inicial e adicione novas etapas</li>
            <li>Use condições para criar caminhos baseados em abertura ou clique</li>
            <li>Adicione atrasos para definir o tempo entre emails</li>
            <li>Clique em "Editar" para configurar cada etapa</li>
          </ul>
        </div>

        <div className="flex flex-grow overflow-hidden border rounded-md">
          <div className={`${editingStepId ? "w-2/3" : "w-full"} overflow-y-auto p-4`}>{renderStep(rootStepId)}</div>
          {editingStepId && <div className="w-1/3 overflow-y-auto">{renderEditPanel()}</div>}
        </div>
      </div>

      <DialogFooter className="flex-shrink-0 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="button" onClick={saveFunnel} disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Funil"}
        </Button>
      </DialogFooter>
    </div>
  )
}
