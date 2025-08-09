import { Box, Container, Skeleton, Grid } from '@mui/material';
import { motion } from 'framer-motion';

const LoadingSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ mt: 10, mb: 2 }}>
        <Container maxWidth="lg">
          <Grid container spacing={2}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
                <Skeleton variant="text" height={24} sx={{ mt: 1 }} />
                <Skeleton variant="text" height={20} width="60%" />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </motion.div>
  );
};

export default LoadingSkeleton;