import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ size = 'md', fullPage = false }) {
  const spinner = (
    <div className={`${styles.spinner} ${styles[size]}`}>
      <div className={styles.ring} />
      <div className={styles.ring} />
      <div className={styles.core} />
    </div>
  );

  if (fullPage) {
    return (
      <div className={styles.fullPage}>
        {spinner}
        <p className={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  return spinner;
}