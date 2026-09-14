import { useAtom } from 'jotai'
import { LogAtom } from '../contexts/Molecule'
import './MessageLog.css'

export const MessageLog = () => {

    const [LogData] = useAtom(LogAtom)

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