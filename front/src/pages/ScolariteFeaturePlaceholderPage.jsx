import styles from './ScolariteFeaturePlaceholderPage.module.css';

export default function ScolariteFeaturePlaceholderPage({ title, breadcrumb, description }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{title}</h1>
          <p>{breadcrumb}</p>
        </div>
      </header>

      <main className={styles.content}>
        <section className={styles.panel}>
          <h2>{title}</h2>
          <p>{description}</p>
        </section>
      </main>
    </div>
  );
}
