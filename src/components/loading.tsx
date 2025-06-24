
interface LoadingProps {
  text: string;
}
export const Loading = ({ text }: LoadingProps) => {
    return (
        <>
            <div className="box-loading">
                <div className="loading-container">
                    <div className="shoe-loader">
                        <div className="spinner"></div>
                    </div>
                    <p className="text-white">{text}</p>
                </div>
            </div>
        </>
    )
}