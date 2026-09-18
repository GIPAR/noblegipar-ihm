import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import { LogAtom } from '../contexts/Molecule'
import { speechService } from '../services/SpeechService'
import './MessageLog.css'

export const MessageLog = () => {

    const [LogData] = useAtom(LogAtom)
    const ultimoIdFalado = useRef<number | null>(null)

    // Sempre que uma mensagem nova chegar, fala ela em voz alta (uma vez só por mensagem)
    useEffect(() => {
        if (!LogData || LogData.msg === "") return
        if (LogData.id === ultimoIdFalado.current) return // evita repetir a mesma mensagem

        ultimoIdFalado.current = LogData.id
        speechService.speak(LogData.msg)
    }, [LogData])

    return (
        <div className='MessageLog'>
            {LogData.msg !== "" && (
          <div className={`Intro-Messagebox ${LogData.error ? 'error': ''}`}
          key={LogData.id} /* This forces the animation to restart even if the message is the same! */>
            <div className='Intro-Messagebox-Exclamationmark'>!</div>
            <p>{LogData.msg}</p>
          </div>)}
        </div>
    )
}